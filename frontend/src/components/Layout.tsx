import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useTheme } from "../hooks/useTheme";
import { Icons } from "./Icons";
import { hasPermission } from "../utils/permissions";
import { useTranslation } from "react-i18next";

export default function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { theme, language, setTheme, setLanguage } = useTheme();
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const allNavItems = [
    {
      path: "/",
      label: t("nav.dashboard"),
      icon: Icons.dashboard,
      permission: "",
    },
    {
      path: "/patients",
      label: t("nav.patients"),
      icon: Icons.patients,
      permission: "view_patients",
    },
    {
      path: "/appointments",
      label: t("nav.appointments"),
      icon: Icons.calendar,
      permission: "view_appointments",
    },
    {
      path: "/invoices",
      label: t("nav.invoices"),
      icon: Icons.invoice,
      permission: "view_invoices",
    },
    {
      path: "/lab-results",
      label: t("nav.labResults"),
      icon: Icons.flask,
      permission: "view_lab_results",
    },
    {
      path: "/tasks",
      label: t("nav.tasks"),
      icon: Icons.task,
      permission: "view_tasks",
    },
    {
      path: "/messages",
      label: t("nav.messages"),
      icon: Icons.mail,
      permission: "",
    },
    {
      path: "/telemedicine",
      label: t("nav.telemedicine"),
      icon: Icons.video,
      permission: "",
    },
  ];
  const navItems = allNavItems.filter(
    (item) => !item.permission || hasPermission(user, item.permission as any),
  );

  const allSettingsItems = [
    {
      path: "/presets",
      label: t("nav.presets"),
      icon: Icons.zap,
      permission: "view_presets",
    },
    {
      path: "/tags",
      label: t("nav.tags"),
      icon: Icons.tag,
      permission: "view_tags",
    },
    {
      path: "/custom-fields",
      label: t("nav.customFields"),
      icon: Icons.fileText,
      permission: "view_custom_fields",
    },
    {
      path: "/note-templates",
      label: t("nav.noteTemplates"),
      icon: Icons.file,
      permission: "view_note_templates",
    },
    {
      path: "/users",
      label: t("nav.users"),
      icon: Icons.users,
      permission: "view_users",
    },
    {
      path: "/email-settings",
      label: t("nav.emailSettings"),
      icon: Icons.mail,
      permission: "view_settings",
    },
    {
      path: "/analytics",
      label: t("nav.analytics"),
      icon: Icons.chart,
      permission: "view_settings",
    },
    {
      path: "/waitlist",
      label: t("nav.waitlist"),
      icon: Icons.clock,
      permission: "view_settings",
    },
    {
      path: "/insurance",
      label: t("nav.insurance"),
      icon: Icons.shield,
      permission: "view_settings",
    },
    {
      path: "/doctor-ratings",
      label: t("nav.doctorRatings"),
      icon: Icons.star,
      permission: "view_settings",
    },
    {
      path: "/remote-monitoring",
      label: t("nav.remoteMonitoring"),
      icon: Icons.activity,
      permission: "view_settings",
    },
    {
      path: "/marketplace",
      label: t("nav.marketplace"),
      icon: Icons.cart,
      permission: "view_settings",
    },
  ];
  const settingsItems = allSettingsItems.filter((item) =>
    hasPermission(user, item.permission as any),
  );

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 shadow-lg shadow-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Desktop Nav */}
            <div className="flex items-center gap-8">
              <h1
                onClick={() => navigate("/")}
                className="text-xl sm:text-2xl font-bold text-white cursor-pointer hover:text-blue-100 transition-all"
              >
                Medora
              </h1>

              {/* Desktop Navigation */}
              <div className="hidden md:flex gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive(item.path)
                        ? "bg-white/20 text-white shadow-md"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon({})}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Right Side - Settings & Logout */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                {Icons.logout({ size: 18 })}
                <span>{t("auth.logout")}</span>
              </button>
              <div className="relative group">
                <button className="p-2 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200">
                  {Icons.settings({ size: 20 })}
                </button>
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 hidden group-hover:block z-50">
                  {/* Theme Toggle */}
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-2">
                      {t("settings.theme")}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          theme === "light"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {t("settings.lightTheme")}
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          theme === "dark"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {t("settings.darkTheme")}
                      </button>
                    </div>
                  </div>
                  {/* Language Toggle */}
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-2">
                      {t("settings.language")}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setLanguage("en")}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          language === "en"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setLanguage("fr")}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          language === "fr"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        Français
                      </button>
                      <button
                        onClick={() => setLanguage("ar")}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          language === "ar"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        العربية
                      </button>
                    </div>
                  </div>
                  {settingsItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${
                        isActive(item.path)
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span>{item.icon({})}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-800 border-t border-blue-600 mobile-menu">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center gap-3 ${
                    isActive(item.path)
                      ? "bg-white/20 text-white"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{item.icon({})}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="border-t border-blue-600 my-2 pt-2">
                <p className="px-4 py-1 text-xs font-medium text-blue-300 uppercase">
                  {t("settings.title")}
                </p>
              </div>
              {/* Theme Toggle - Mobile */}
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-blue-300 uppercase mb-2">
                  {t("settings.theme")}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      theme === "light"
                        ? "bg-white text-blue-700"
                        : "bg-blue-700 text-blue-200 hover:bg-blue-600"
                    }`}
                  >
                    {t("settings.lightTheme")}
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      theme === "dark"
                        ? "bg-white text-blue-700"
                        : "bg-blue-700 text-blue-200 hover:bg-blue-600"
                    }`}
                  >
                    {t("settings.darkTheme")}
                  </button>
                </div>
              </div>
              {/* Language Toggle - Mobile */}
              <div className="px-4 py-2 pb-3">
                <p className="text-xs font-medium text-blue-300 uppercase mb-2">
                  {t("settings.language")}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      language === "en"
                        ? "bg-white text-blue-700"
                        : "bg-blue-700 text-blue-200 hover:bg-blue-600"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage("fr")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      language === "fr"
                        ? "bg-white text-blue-700"
                        : "bg-blue-700 text-blue-200 hover:bg-blue-600"
                    }`}
                  >
                    Français
                  </button>
                  <button
                    onClick={() => setLanguage("ar")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      language === "ar"
                        ? "bg-white text-blue-700"
                        : "bg-blue-700 text-blue-200 hover:bg-blue-600"
                    }`}
                  >
                    العربية
                  </button>
                </div>
              </div>
              {settingsItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left font-medium transition-colors flex items-center gap-3 ${
                    isActive(item.path)
                      ? "bg-white/20 text-white"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon({})}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center gap-3 text-red-200 hover:bg-red-500/20 hover:text-red-100"
              >
                {Icons.logout({ size: 20 })}
                <span>{t("auth.logout")}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
