import { Outlet } from "react-router-dom";
import { useRef } from "react";
import Navbar from "../../components/Navbar";

export default function Layout() {
  const nodeRef = useRef(null);

  return (
    <div>
      <Navbar />
      <div ref={nodeRef}>
        <Outlet />
      </div>
    </div>
  );
}
