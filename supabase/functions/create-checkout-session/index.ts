import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
const cors={"Access-Control-Allow-Origin":"https://media.teens2inspire.org","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:cors});
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),stripeKey=Deno.env.get("STRIPE_SECRET_KEY");
 if(!url||!anon||!service||!stripeKey)return new Response(JSON.stringify({error:"Checkout is not configured on the server."}),{status:503,headers:cors});
 const auth=req.headers.get("Authorization");if(!auth?.startsWith("Bearer "))return new Response(JSON.stringify({error:"Sign in is required."}),{status:401,headers:cors});
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});const {data:{user},error:userError}=await userClient.auth.getUser();if(userError||!user)return new Response(JSON.stringify({error:"Your session expired. Please sign in again."}),{status:401,headers:cors});
 let body:{tier?:string};try{body=await req.json()}catch{return new Response(JSON.stringify({error:"Invalid request."}),{status:400,headers:cors})}
 const tier=body.tier;if(tier!=="personal"&&tier!=="family")return new Response(JSON.stringify({error:"Choose a valid membership."}),{status:400,headers:cors});
 const priceId=tier==="personal"?Deno.env.get("STRIPE_PRICE_PERSONAL_MONTHLY"):Deno.env.get("STRIPE_PRICE_FAMILY_MONTHLY");if(!priceId)return new Response(JSON.stringify({error:"The selected membership price is not configured."}),{status:503,headers:cors});
 const stripe=new Stripe(stripeKey,{httpClient:Stripe.createFetchHttpClient()});const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {data:profile}=await db.from("profiles").select("stripe_customer_id,membership_status").eq("id",user.id).maybeSingle();
  if(profile?.membership_status==="active"&&profile?.stripe_customer_id){const {data:active}=await db.from("subscriptions").select("id").eq("user_id",user.id).in("status",["active","trialing"]).limit(1);if(active?.length)return new Response(JSON.stringify({error:"Your account already has an active membership. Use the billing portal to manage it."}),{status:409,headers:cors});}
  let customerId=profile?.stripe_customer_id||undefined;if(!customerId){const customer=await stripe.customers.create({email:user.email,metadata:{supabase_user_id:user.id}});customerId=customer.id;await db.from("profiles").update({stripe_customer_id:customerId}).eq("id",user.id);}
  const session=await stripe.checkout.sessions.create({mode:"subscription",customer:customerId,line_items:[{price:priceId,quantity:1}],client_reference_id:user.id,metadata:{supabase_user_id:user.id,membership_tier:tier},subscription_data:{metadata:{supabase_user_id:user.id,membership_tier:tier}},success_url:"https://media.teens2inspire.org/membership?success=1&session_id={CHECKOUT_SESSION_ID}",cancel_url:"https://media.teens2inspire.org/membership?cancelled=1",allow_promotion_codes:true});
  return new Response(JSON.stringify({url:session.url}),{status:200,headers:cors});
 }catch(err){console.error("checkout session creation failed",err);return new Response(JSON.stringify({error:"Stripe could not start checkout. Check the server Stripe configuration."}),{status:502,headers:cors});}
});
