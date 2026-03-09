import { 
  Home, 
  Lightbulb, 
  FileText, 
  Clock, 
  TrendingUp, 
  Layers, 
  Calendar,
  FileUp,
  BookOpen,
  Brain,
  Mic,
  History,
  Bell,
  Crown,
  LogOut,
  UserCircle,
  Moon,
  Sun,
  Search
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Study Helper", url: "/study", icon: Lightbulb },
  { title: "Note Organizer", url: "/notes", icon: FileText },
  { title: "Progress", url: "/progress", icon: TrendingUp },
];

const toolItems = [
  { title: "Flashcards", url: "/flashcards", icon: Layers },
  { title: "Revision Planner", url: "/planner", icon: Calendar },
  { title: "PDF Summarizer", url: "/pdf-summarizer", icon: FileUp },
  { title: "Mind Map", url: "/mind-map", icon: Brain },
  { title: "Lecture Capture", url: "/lecture-capture", icon: Mic },
  { title: "Pomodoro", url: "/pomodoro", icon: Clock },
  { title: "Spaced Review", url: "/spaced-review", icon: BookOpen },
];

const accountItems = [
  { title: "History", url: "/history", icon: History },
  { title: "Reminders", url: "/reminders", icon: Bell },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

interface AppSidebarProps {
  dark: boolean;
  setDark: (dark: boolean) => void;
  onSearch: () => void;
}

export function AppSidebar({ dark, setDark, onSearch }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isPremium, promptUpgrade } = usePremium();
  const { signOut } = useAuth();

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-1.5 shadow-sm shrink-0">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-display font-bold text-foreground tracking-tight">StudyFlow</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-1">
            {!collapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-1">
            {!collapsed && "Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-1">
            {!collapsed && "Account"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* Pro badge or upgrade button */}
        {isPremium ? (
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-warning bg-warning/10 px-3 py-2 rounded-xl border border-warning/20">
            <Crown className="h-3.5 w-3.5" />
            {!collapsed && <span>PRO</span>}
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={promptUpgrade} 
            className="w-full gap-1.5 text-xs text-warning border-warning/30 hover:bg-warning/10 rounded-xl"
          >
            <Crown className="h-3.5 w-3.5" />
            {!collapsed && <span>Upgrade to Pro</span>}
          </Button>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" onClick={onSearch} className="h-8 w-8 rounded-lg">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="h-8 w-8 rounded-lg">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 rounded-lg text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
