
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      
     <main dir="rtl" className="pt-[60px] px-2 bg-black min-h-screen">

        <Outlet />
      </main>
     
    </>
  );

}
