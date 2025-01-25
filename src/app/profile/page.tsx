"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import Metadata from "../../components/MetaData";

const getInitials = (name: string): string => {
  if (!name) return "U";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ProfilePage = () => {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [updateError, setUpdateError] = useState("");

  // Display states (for header)
  const [displayProfile, setDisplayProfile] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });

  // Form states (for editing)
  const [userProfile, setUserProfile] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newConfirmPassword: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError("");
  };

  const handleSave = async () => {
    try {
      // Show loading state
      Swal.fire({
        title: "Updating Profile",
        text: "Please wait...",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
        color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Send request to update profile
      const apiCall = await fetch(`/api/user/${session?.user?.id}/detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: userProfile.name,
          email: userProfile.email,
        }),
      });

      const response = await apiCall.json();

      if (!apiCall.ok) {
        await Swal.fire({
          title: "Error!",
          text: response.message || "Failed to update profile",
          icon: "error",
          confirmButtonText: "OK",
          background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
          color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
          confirmButtonColor: "#4f46e5",
        });
      } else {
        // Update display profile with new values
        setDisplayProfile({
          name: response.data.name,
          email: response.data.email,
        });

        // Show success message
        await Swal.fire({
          title: "Success!",
          text: "Your profile has been updated successfully",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
          color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        });
      }
    } catch (error) {
      // Show error message
      await Swal.fire({
        title: "Error!",
        text:
          error instanceof Error ? error.message : "Failed to update profile",
        icon: "error",
        confirmButtonText: "OK",
        background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
        color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        confirmButtonColor: "#4f46e5",
      });
      setUpdateError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  const handlePasswordSave = async () => {
    try {
      // Show loading state
      Swal.fire({
        title: "Updating Profile",
        text: "Please wait...",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
        color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const apiCall = await fetch(`/api/user/${session?.user?.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          new_password_confirmation: passwordForm.newConfirmPassword,
        }),
      });

      if (!apiCall.ok) {
        const response = await apiCall.json();

        await Swal.fire({
          title: "Error!",
          text: response.message || "Failed to update password",
          icon: "error",
          confirmButtonText: "OK",
          background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
          color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
          confirmButtonColor: "#4f46e5",
        });
      } else {
        await Swal.fire({
          title: "Success!",
          text: "Your password has been updated successfully",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
          color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        });
      }

      // Clear password form and close edit mode on success
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        newConfirmPassword: "",
      });
      setPasswordError("");
    } catch (error) {
      // Show error message
      await Swal.fire({
        title: "Error!",
        text:
          error instanceof Error ? error.message : "Failed to update password",
        icon: "error",
        confirmButtonText: "OK",
        background: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
        color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  if (!session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Please sign in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  const userInitials = getInitials(displayProfile.name);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Metadata seoTitle={"Profile - Just API Doc"} />
      <div className="space-y-6">
        {/* Profile Picture Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center space-x-6">
            <div className="relative group h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
              <span className="text-white text-3xl font-medium tracking-wider">
                {userInitials}
              </span>
            </div>
            <div className="flex-1">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {displayProfile.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {displayProfile.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Profile Details
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={userProfile.name}
                onChange={handleProfileChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={userProfile.email}
                onChange={handleProfileChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>
          </div>
          {updateError && (
            <div className="mt-4 text-sm text-red-600 dark:text-red-400">
              {updateError}
            </div>
          )}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => handleSave()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 gap-2"
            >
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Save Changes
              </>
            </button>
          </div>
        </div>

        {/* Password Settings Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Password Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <div className="flex items-center">
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 sm:text-sm"
                  placeholder="Enter your current password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 sm:text-sm"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="newConfirmPassword"
                  value={passwordForm.newConfirmPassword}
                  onChange={handlePasswordChange}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 sm:text-sm"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {passwordError && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-4">
              {passwordError}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={handlePasswordSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
