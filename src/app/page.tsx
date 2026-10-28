import { redirect } from "next/navigation";

export const metadata = {
  title: "Teens2Inspire Media",
  description:
    "A thoughtful media library for Jewish teen girls. Watch, listen, read, and save the things that stay with you.",
};

export default function HomePage() {
  redirect("/app");
}
