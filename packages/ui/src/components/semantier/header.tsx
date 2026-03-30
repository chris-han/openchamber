import {
  Layers,
  Settings,
  HelpCircle,
  Upload,
  Download,
  Play,
  Search,
  Bell,
  User,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/stores/useUIStore'

export function Header() {
  const currentLayout = useUIStore((state) => state.currentLayout);
  const setCurrentLayout = useUIStore((state) => state.setCurrentLayout);
  return (
    <header className="h-12 flex items-center justify-between px-4 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Semantier Studio</span>
          <Badge variant="secondary" className="text-[10px] px-1.5">Beta</Badge>
        </div>

        {/* Command Palette Trigger */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索命令..."
            className="w-64 pl-8 h-8 text-sm bg-secondary border-0"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Action Buttons */}
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          导入
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          导出
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="default" size="sm" className="h-8 text-xs">
          <Play className="h-3.5 w-3.5 mr-1.5" />
          验证
        </Button>
        <div className="w-px h-5 bg-border mx-1" />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Layout Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="Switch UI Layout"
            >
              <LayoutTemplate className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              onClick={() => setCurrentLayout('semantier')}
              className={currentLayout === 'semantier' ? 'bg-accent' : ''}
            >
              <span>Semantier Studio</span>
              {currentLayout === 'semantier' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setCurrentLayout('main')}
              className={currentLayout === 'main' ? 'bg-accent' : ''}
            >
              <span>Original Dev UI</span>
              {currentLayout === 'main' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>个人设置</DropdownMenuItem>
            <DropdownMenuItem>工作空间</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
