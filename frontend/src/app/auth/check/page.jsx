"use client";

import {
  useAuth,
  useClerk,
  useUser,
} from "@clerk/nextjs";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCheckPage() {
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const {
    user,
    isLoaded: isUserLoaded,
  } = useUser();

  const { signOut } = useClerk();

  const router = useRouter();

  const [message, setMessage] = useState(
    "Verifying your account..."
  );

  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) {
      return;
    }

    // =================================================
    // NOT SIGNED IN
    // =================================================

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    const verifyUser = async () => {
      try {
        setProcessing(true);

        setMessage(
          "Verifying your Sports Meet account..."
        );

        const token = await getToken();

        if (!token) {
          throw new Error(
            "Unable to obtain authentication token."
          );
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL;

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        // =================================================
        // STEP 1: CHECK EXISTING MONGO USER
        // =================================================

        let response;

        try {
          response = await axios.get(
            `${apiUrl}/api/users/me`,
            config
          );
        } catch (error) {

          // =================================================
          // USER DOES NOT EXIST IN MONGO
          // =================================================

          if (error.response?.status === 404) {

            setMessage(
              "Creating your Sports Meet account..."
            );

            const email =
              user?.primaryEmailAddress?.emailAddress;

            const name =
              user?.fullName ||
              user?.firstName ||
              email?.split("@")[0] ||
              "Student";

            if (!email) {
              throw new Error(
                "Email address is not available from your Clerk account."
              );
            }

            // =================================================
            // CREATE MONGO USER
            // =================================================

            try {
              response = await axios.post(
                `${apiUrl}/api/users/me`,
                {
                  name,
                  email,
                  phone:
                    user?.primaryPhoneNumber
                      ?.phoneNumber || "",
                },
                config
              );
            } catch (createError) {

              // =================================================
              // IMPORTANT:
              // IF USER WAS CREATED ALREADY, FETCH IT AGAIN
              // =================================================

              if (
                createError.response?.status === 409
              ) {

                setMessage(
                  "Account found. Loading your Sports Meet account..."
                );

                response = await axios.get(
                  `${apiUrl}/api/users/me`,
                  config
                );

              } else {
                throw createError;
              }
            }

          } else {
            throw error;
          }
        }

        // =================================================
        // USER DATA
        // =================================================

        const applicationUser =
          response.data?.data;

        if (!applicationUser) {
          throw new Error(
            "User information was not found."
          );
        }

        console.log(
          "Sports Meet Mongo User:",
          applicationUser
        );

        // =================================================
        // CHECK ACTIVE STATUS
        // =================================================

        if (
          applicationUser.isActive === false
        ) {
          setMessage(
            "This account has been deactivated."
          );

          await signOut();

          setTimeout(() => {
            router.replace("/");
          }, 2000);

          return;
        }

        // =================================================
        // ROLE BASED REDIRECTION
        // =================================================

        switch (applicationUser.role) {

          case "admin":
            router.replace("/admin");
            break;

          case "sports_officer":
            router.replace("/sports-officer");
            break;

          case "college_coordinator":
            router.replace("/college");
            break;

          case "student":
            router.replace("/student");
            break;

          default:
            setMessage(
              "Your account does not have a valid system role."
            );

            await signOut();

            setTimeout(() => {
              router.replace("/");
            }, 2000);

            break;
        }

      } catch (error) {

        console.error(
          "Authentication verification failed:",
          error
        );

        console.error(
          "Status:",
          error.response?.status
        );

        console.error(
          "Response:",
          error.response?.data
        );

        if (
          error.response?.status === 401
        ) {

          setMessage(
            "Authentication failed. Please sign in again."
          );

        } else if (
          error.response?.status === 403
        ) {

          setMessage(
            "Your account does not have permission to access the system."
          );

        } else {

          setMessage(
            "Unable to verify your account. Please try again."
          );
        }

        try {
          await signOut();
        } catch (signOutError) {
          console.error(
            "Sign out failed:",
            signOutError
          );
        }

        setTimeout(() => {
          router.replace("/");
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    verifyUser();

  }, [
    isLoaded,
    isSignedIn,
    isUserLoaded,
    user,
    getToken,
    signOut,
    router,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4">

      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">

        {processing && (
          <div className="mx-auto mb-6 h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
        )}

        {!processing && (
          <div className="mx-auto mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            !
          </div>
        )}

        <h1 className="text-xl font-semibold text-slate-900">
          Account Verification
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message}
        </p>

      </div>

    </div>
  );
}