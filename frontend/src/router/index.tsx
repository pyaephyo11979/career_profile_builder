import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home.tsx";
import Login from "../pages/Login.tsx";
import Register from "../pages/Register.tsx";
import Layout from "../pages/layouts/Layout";
import UploadPage from "../pages/UploadPage.tsx";
import ResultPage from "../pages/ResultPage.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import { RedirectIfAuthed, RequireAuth } from "./guards";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "/login",
        element: (
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        ),
      },
      {
        path: "/register",
        element: (
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        ),
      },
      {
        path: "/upload",
        element: (
          <RequireAuth>
            <UploadPage />
          </RequireAuth>
        ),
      },
      {
        path: "/profile",
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: "/resumes/:id",
        element: (
          <RequireAuth>
            <ResultPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);

export default router;
