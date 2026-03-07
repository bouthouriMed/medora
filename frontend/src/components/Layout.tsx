import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useTheme } from "../hooks/useTheme";
import { Icons } from "./Icons";
import { hasPermission } from "../utils/permissions";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";

interface NavItem {
  path: string;
  label: string;
  icon: (props: any) => JSX.Element;
  permission: string;
}

interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { theme, language, setTheme, setLanguage } = useTheme();
  const { t } = useTranslation();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("medora-sidebar-collapsed");
    return saved === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const saved = localStorage.getItem("medora-sidebar-sections");
    return saved
      ? JSON.parse(saved)
      : {
          clinical: true,
          communication: true,
          billing: true,
          insights: false,
          admin: false,
        };
  });
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("medora-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(
      "medora-sidebar-sections",
      JSON.stringify(expandedSections),
    );
  }, [expandedSections]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Navigation sections organized by clinic workflow
  const sections: NavSection[] = [
    {
      key: "clinical",
      label: t("nav.sections.clinical"),
      items: [
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
          path: "/waitlist",
          label: t("nav.waitlist"),
          icon: Icons.clock,
          permission: "view_settings",
        },
        {
          path: "/lab-results",
          label: t("nav.labResults"),
          icon: Icons.flask,
          permission: "view_lab_results",
        },
        {
          path: "/telemedicine",
          label: t("nav.telemedicine"),
          icon: Icons.video,
          permission: "",
        },
        {
          path: "/remote-monitoring",
          label: t("nav.remoteMonitoring"),
          icon: Icons.activity,
          permission: "view_settings",
        },
      ],
    },
    {
      key: "communication",
      label: t("nav.sections.communication"),
      items: [
        {
          path: "/messages",
          label: t("nav.messages"),
          icon: Icons.mail,
          permission: "",
        },
        {
          path: "/tasks",
          label: t("nav.tasks"),
          icon: Icons.task,
          permission: "view_tasks",
        },
      ],
    },
    {
      key: "billing",
      label: t("nav.sections.billing"),
      items: [
        {
          path: "/invoices",
          label: t("nav.invoices"),
          icon: Icons.invoice,
          permission: "view_invoices",
        },
        {
          path: "/insurance",
          label: t("nav.insurance"),
          icon: Icons.shield,
          permission: "view_settings",
        },
        {
          path: "/marketplace",
          label: t("nav.marketplace"),
          icon: Icons.cart,
          permission: "view_settings",
        },
      ],
    },
    {
      key: "insights",
      label: t("nav.sections.insights"),
      items: [
        {
          path: "/analytics",
          label: t("nav.analytics"),
          icon: Icons.chart,
          permission: "view_settings",
        },
        {
          path: "/doctor-ratings",
          label: t("nav.doctorRatings"),
          icon: Icons.star,
          permission: "view_settings",
        },
      ],
    },
    {
      key: "admin",
      label: t("nav.sections.admin"),
      items: [
        {
          path: "/settings",
          label: t("nav.settings"),
          icon: Icons.settings,
          permission: "view_settings",
        },
        {
          path: "/users",
          label: t("nav.users"),
          icon: Icons.users,
          permission: "view_users",
        },
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
          path: "/email-settings",
          label: t("nav.emailSettings"),
          icon: Icons.mail,
          permission: "view_settings",
        },
        {
          path: "/audit-logs",
          label: t("nav.auditLogs"),
          icon: Icons.history,
          permission: "view_settings",
        },
      ],
    },
  ];

  // Filter sections based on permissions
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.permission || hasPermission(user, item.permission as any),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const active = isActive(item.path);
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        title={collapsed && !isMobile ? item.label : undefined}
        className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          active
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
      >
        <span
          className={`flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}
        >
          {item.icon({ size: 18 })}
        </span>
        {(!collapsed || isMobile) && (
          <span className="truncate">{item.label}</span>
        )}
        {active && (!collapsed || isMobile) && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        )}
      </button>
    );
  };

  const renderSection = (section: NavSection, isMobile = false) => {
    const isExpanded = expandedSections[section.key] !== false;
    const hasActiveItem = section.items.some((item) => isActive(item.path));

    if (collapsed && !isMobile) {
      // Collapsed mode: just show icons with a subtle divider
      return (
        <div key={section.key} className="py-1">
          <div className="mx-3 mb-1 border-t border-gray-200 dark:border-gray-700"></div>
          {section.items.map((item) => renderNavItem(item, isMobile))}
        </div>
      );
    }

    return (
      <div key={section.key} className="py-1">
        <button
          onClick={() => toggleSection(section.key)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          <span className="flex items-center gap-2">
            {hasActiveItem && (
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
            )}
            {section.label}
          </span>
          <span
            className={`transform transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
          >
            {Icons.chevronDown({ size: 14 })}
          </span>
        </button>
        <div
          className={`space-y-0.5 overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          {section.items.map((item) => renderNavItem(item, isMobile))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        {/* Logo area */}
        <div
          className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 ${collapsed ? "justify-center px-2" : "px-4 justify-between"}`}
        >
          {!collapsed && (
            <button
              onClick={() => navigate("/")}
              className="cursor-pointer text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Medora
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed
              ? Icons.chevronRight({ size: 18 })
              : Icons.chevronLeft({ size: 18 })}
          </button>
        </div>

        {/* Dashboard link */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => navigate("/")}
            title={collapsed ? t("nav.dashboard") : undefined}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive("/")
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md shadow-blue-500/20"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            } ${collapsed ? "justify-center px-2" : ""}`}
          >
            <span className="flex-shrink-0">
              {Icons.dashboard({ size: 20 })}
            </span>
            {!collapsed && <span>{t("nav.dashboard")}</span>}
          </button>
        </div>

        {/* Scrollable nav sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 custom-scrollbar space-y-0.5">
          {filteredSections.map((section) => renderSection(section))}
        </nav>

        {/* Bottom: Theme & Language */}
        <div
          className={`flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-2 space-y-1 ${collapsed ? "items-center" : ""}`}
        >
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={
              theme === "dark"
                ? t("settings.lightTheme")
                : t("settings.darkTheme")
            }
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${collapsed ? "justify-center px-2" : ""}`}
          >
            <span className="flex-shrink-0">
              {theme === "dark"
                ? Icons.sun({ size: 18 })
                : Icons.moon({ size: 18 })}
            </span>
            {!collapsed && (
              <span>
                {theme === "dark"
                  ? t("settings.lightTheme")
                  : t("settings.darkTheme")}
              </span>
            )}
          </button>

          {/* Language switcher */}
          {!collapsed && (
            <div className="flex gap-1 px-1">
              {(["en", "fr", "ar"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    language === lang
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {lang === "en" ? "EN" : lang === "fr" ? "FR" : "AR"}
                </button>
              ))}
            </div>
          )}
          {collapsed && (
            <button
              onClick={() =>
                setLanguage(
                  language === "en" ? "fr" : language === "fr" ? "ar" : "en",
                )
              }
              title={`Language: ${language.toUpperCase()}`}
              className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {language.toUpperCase()}
            </button>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-60"}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
          {/* Left: Mobile menu + page context */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen
                ? Icons.x({ size: 20 })
                : Icons.menu({ size: 20 })}
            </button>
            <h2
              onClick={() => navigate("/")}
              className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-white lg:hidden"
            >
              Medora
            </h2>
          </div>

          {/* Center: Keyboard shortcut hint */}
          <div className="hidden md:flex items-center">
            <kbd className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
              Ctrl+K
            </kbd>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
              {t("common.search")}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate("/patients?action=new")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={t("patients.addPatient")}
            >
              {Icons.user({ size: 16 })}
              <span className="hidden lg:inline">
                {t("patients.addPatient")}
              </span>
            </button>
            <button
              onClick={() => navigate("/appointments?action=new")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              title={t("appointments.newAppointment")}
            >
              {Icons.plus({ size: 16 })}
              <span className="hidden lg:inline">
                {t("appointments.newAppointment")}
              </span>
            </button>
          </div>

          {/* Right: User profile & logout */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <NotificationBell />

            {/* Mobile theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === "dark"
                ? Icons.sun({ size: 18 })
                : Icons.moon({ size: 18 })}
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.[0] || "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.firstName || "User"}
                </span>
                {Icons.chevronDown({ size: 14, className: "text-gray-400" })}
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {Icons.settings({ size: 16 })}
                      <span>{t("nav.settings")}</span>
                    </button>
                    {/* Language switcher for mobile in dropdown */}
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 sm:hidden">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1.5">
                        {t("settings.language")}
                      </p>
                      <div className="flex gap-1">
                        {(["en", "fr", "ar"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              language === lang
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {lang === "en" ? "EN" : lang === "fr" ? "FR" : "AR"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      {Icons.logout({ size: 16 })}
                      <span>{t("auth.logout")}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl sidebar-slide-in">
              {/* Mobile sidebar header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => navigate("/")}
                  className="cursor-pointer text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Medora
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {Icons.x({ size: 20 })}
                </button>
              </div>

              {/* Dashboard */}
              <div className="px-2 pt-3 pb-1">
                <button
                  onClick={() => navigate("/")}
                  className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/")
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {Icons.dashboard({ size: 20 })}
                  <span>{t("nav.dashboard")}</span>
                </button>
              </div>

              {/* Mobile nav sections */}
              <nav className="px-2 py-1 space-y-0.5">
                {filteredSections.map((section) =>
                  renderSection(section, true),
                )}
              </nav>

              {/* Mobile bottom controls */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-3 mt-4">
                <div className="flex gap-1 mb-2">
                  {(["en", "fr", "ar"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                        language === lang
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {lang === "en"
                        ? "English"
                        : lang === "fr"
                          ? "Français"
                          : "العربية"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {Icons.logout({ size: 18 })}
                  <span>{t("auth.logout")}</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
