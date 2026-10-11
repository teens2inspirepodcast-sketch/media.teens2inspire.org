import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
function mapStatus(status:string){if(status==="active"||status==="trialing")return "active";if(status==="past_due"||status==="unpaid"||status==="paused")return "past_due";if(status==="canceled")return "canceled";if(status==="incomplete"||status==="incomplete_expired")return "pending_payment";return "inactive";}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const stripeKey=Deno.env.get("STRIPE_SECRET_KEY"),webhookSecret=Deno.env.get("STRIPE_WEBHOOK_SECRET"),url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!stripeKey||!webhookSecret||!url||!service)return json({error:"Webhook is not configured."},503);
 const signature=req.headers.get("stripe-signature");if(!signature)return json({error:"Missing Stripe signature."},400);
 const stripe=new Stripe(stripeKey,{httpClient:Stripe.createFetchHttpClient()});const raw=await req.text();let event:Stripe.Event;
 try{event=await stripe.webhooks.constructEventAsync(raw,signature,webhookSecret,undefined,Stripe.createSubtleCryptoProvider());}catch(err){console.error("invalid Stripe webhook signature",err);return json({error:"Invalid signature."},400);}
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error:claimError}=await db.from("stripe_webhook_events").insert({event_id:event.id,event_type:event.type,livemode:event.livemode,status:"processing",processing_started_at:new Date().toISOString()});
 if(claimError){const {data:existing}=await db.from("stripe_webhook_events").select("status").eq("event_id",event.id).maybeSingle();if(existing?.status==="processed")return json({received:true,duplicate:true});if(existing?.status==="failed"){const {error:retryError}=await db.from("stripe_webhook_events").update({status:"processing",processing_started_at:new Date().toISOString(),last_error:null}).eq("event_id",event.id);if(retryError)return json({error:"Could not retry failed event."},500);}else if(existing)return json({error:"Event is already being processed."},409);else return json({error:"Could not record webhook event."},500);}
 try{
  let subscription:Stripe.Subscription|null=null;
  if(event.type==="checkout.session.completed"){const session=event.data.object as Stripe.Checkout.Session;if(session.mode==="subscription"&&typeof session.subscription==="string")subscription=await stripe.subscriptions.retrieve(session.subscription);}
  else if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){subscription=event.data.object as Stripe.Subscription;}
  else if(event.type==="invoice.paid"||event.type==="invoice.payment_failed"){const invoice=event.data.object as Stripe.Invoice;const subId=typeof invoice.subscription==="string"?invoice.subscription:invoice.subscription?.id;if(subId)subscription=await stripe.subscriptions.retrieve(subId);}
  if(subscription){
   const userId=subscription.metadata.supabase_user_id;const tier=subscription.metadata.membership_tier==="family"?"family":"personal";
   if(!userId)throw new Error("Subscription metadata does not contain the Supabase user ID.");
   const priceId=subscription.items.data[0]?.price.id;if(!priceId)throw new Error("Subscription has no price.");
   const periodStart=(subscription as unknown as {current_period_start?:number}).current_period_start;const periodEnd=(subscription as unknown as {current_period_end?:number}).current_period_end;
   const customerId=typeof subscription.customer==="string"?subscription.customer:subscription.customer.id;
   const periodStartIso=periodStart?new Date(periodStart*1000).toISOString():null;const periodEndIso=periodEnd?new Date(periodEnd*1000).toISOString():null;
   const row={user_id:userId,stripe_customer_id:customerId,stripe_subscription_id:subscription.id,stripe_price_id:priceId,status:subscription.status,current_period_start:periodStartIso,current_period_end:periodEndIso,cancel_at_period_end:subscription.cancel_at_period_end,canceled_at:subscription.canceled_at?new Date(subscription.canceled_at*1000).toISOString():null,updated_at:new Date().toISOString()};
   const {error:subError}=await db.from("subscriptions").upsert(row,{onConflict:"stripe_subscription_id"});if(subError)throw subError;
   const {error:profileError}=await db.from("profiles").update({stripe_customer_id:customerId,stripe_subscription_id:subscription.id,membership_tier:tier,membership_type:"standard",membership_status:mapStatus(subscription.status),membership_period_end:periodEndIso,cancel_at_period_end:subscription.cancel_at_period_end}).eq("id",userId);if(profileError)throw profileError;
  }
  await db.from("stripe_webhook_events").update({status:"processed",processed_at:new Date().toISOString(),last_error:null}).eq("event_id",event.id);
  return json({received:true});
 }catch(err){console.error("Stripe webhook processing failed",event.id,err);await db.from("stripe_webhook_events").update({status:"failed",last_error:String(err).slice(0,1000)}).eq("event_id",event.id);return json({error:"Event processing failed; Stripe may retry."},500);}
});
