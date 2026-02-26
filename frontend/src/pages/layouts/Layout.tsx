import { Outlet } from "react-router-dom";
import { useRef } from "react";
import Navbar from "../../components/Navbar";

export default function Layout() {
  const nodeRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#090E34]">
      <Navbar />
      <div ref={nodeRef}>
        <Outlet />
      </div>
    </div>
  );
}
