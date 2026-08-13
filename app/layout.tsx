import './globals.css';import type { Metadata } from 'next';
export const metadata:Metadata={title:'MESQUITE ICS | Hallway Monitor Tracker',description:'PK–12 live campus student hallway status'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
