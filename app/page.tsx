import dynamic from "next/dynamic";

const Landing = dynamic(() => import("./landing/page"), { ssr: true });

export default function Page() {
  return <Landing />;
}
