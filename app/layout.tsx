import './globals.css';import type { Metadata } from 'next';
export const metadata:Metadata={title:'MESQUITE ICS | Bathroom Monitor Tracker',description:'Real-time PK–12 student bathroom status'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
