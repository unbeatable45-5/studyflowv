import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Save,
  FolderOpen,
  Download,
  Trash2,
  Network,
  ArrowLeft,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nodeColors = {
  primary: { bg: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))" },
  success: { bg: "hsl(var(--success))", text: "hsl(var(--success-foreground))" },
  warning: { bg: "hsl(var(--warning))", text: "hsl(var(--warning-foreground))" },
  destructive: { bg: "hsl(var(--destructive))", text: "hsl(var(--destructive-foreground))" },
  accent: { bg: "hsl(var(--accent))", text: "hsl(var(--accent-foreground))" },
  muted: { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" },
};

const MindMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mindMapTitle, setMindMapTitle] = useState("Untitled Mind Map");
  const [mindMapDescription, setMindMapDescription] = useState("");
  const [mindMapSubject, setMindMapSubject] = useState("");
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [savedMaps, setSavedMaps] = useState<any[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeColor, setNewNodeColor] = useState("primary");
  const [addNodeDialogOpen, setAddNodeDialogOpen] = useState(false);

  // Fetch saved mind maps
  const fetchSavedMaps = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("mind_maps")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setSavedMaps(data);
    }
  };

  useEffect(() => {
    fetchSavedMaps();
  }, [user]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = () => {
    if (!newNodeLabel.trim()) {
      toast({ title: "Please enter a label", variant: "destructive" });
      return;
    }

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "default",
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: { label: newNodeLabel },
      style: {
        background: nodeColors[newNodeColor as keyof typeof nodeColors].bg,
        color: nodeColors[newNodeColor as keyof typeof nodeColors].text,
        border: "2px solid",
        borderColor: nodeColors[newNodeColor as keyof typeof nodeColors].bg,
        padding: "12px 20px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "600",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNewNodeLabel("");
    setAddNodeDialogOpen(false);
    toast({ title: "Node added!" });
  };

  const saveMindMap = async () => {
    if (!user) return;

    const mindMapData = {
      user_id: user.id,
      title: mindMapTitle,
      description: mindMapDescription,
      subject: mindMapSubject || null,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
    };

    try {
      if (currentMapId) {
        // Update existing
        const { error } = await supabase
          .from("mind_maps")
          .update(mindMapData)
          .eq("id", currentMapId);

        if (error) throw error;
        toast({ title: "Mind map updated!" });
      } else {
        // Create new
        const { data, error } = await supabase
          .from("mind_maps")
          .insert([mindMapData])
          .select()
          .single();

        if (error) throw error;
        setCurrentMapId(data.id);
        toast({ title: "Mind map saved!" });
      }
      fetchSavedMaps();
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMindMap = (map: any) => {
    setCurrentMapId(map.id);
    setMindMapTitle(map.title);
    setMindMapDescription(map.description || "");
    setMindMapSubject(map.subject || "");
    setNodes(JSON.parse(map.nodes));
    setEdges(JSON.parse(map.edges));
    setLoadDialogOpen(false);
    toast({ title: "Mind map loaded!" });
  };

  const deleteMindMap = async (id: string) => {
    const { error } = await supabase.from("mind_maps").delete().eq("id", id);
    if (!error) {
      toast({ title: "Mind map deleted" });
      fetchSavedMaps();
      if (currentMapId === id) {
        setCurrentMapId(null);
        setNodes([]);
        setEdges([]);
        setMindMapTitle("Untitled Mind Map");
        setMindMapDescription("");
        setMindMapSubject("");
      }
    }
  };

  const createNewMap = () => {
    setCurrentMapId(null);
    setNodes([]);
    setEdges([]);
    setMindMapTitle("Untitled Mind Map");
    setMindMapDescription("");
    setMindMapSubject("");
    toast({ title: "New mind map created" });
  };

  const exportAsJSON = () => {
    const data = {
      title: mindMapTitle,
      description: mindMapDescription,
      subject: mindMapSubject,
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mindMapTitle.replace(/\s+/g, "-")}.json`;
    a.click();
    toast({ title: "Mind map exported!" });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="glass-strong border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Network className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0">
          <Input
            value={mindMapTitle}
            onChange={(e) => setMindMapTitle(e.target.value)}
            className="font-display font-semibold text-lg border-none bg-transparent shadow-none focus-visible:ring-0 px-2"
            placeholder="Mind Map Title"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addNodeDialogOpen} onOpenChange={setAddNodeDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Add Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Node</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="Enter node label"
                    onKeyDown={(e) => e.key === "Enter" && addNode()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={newNodeColor} onValueChange={setNewNodeColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(nodeColors).map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded"
                              style={{
                                background:
                                  nodeColors[color as keyof typeof nodeColors].bg,
                              }}
                            />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addNode} className="w-full">
                  Add Node
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={saveMindMap}
            className="gap-2 rounded-xl"
          >
            <Save className="h-4 w-4" /> Save
          </Button>

          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                <FolderOpen className="h-4 w-4" /> Load
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Saved Mind Maps</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  onClick={createNewMap}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" /> Create New Mind Map
                </Button>
                {savedMaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No saved mind maps yet
                  </p>
                ) : (
                  savedMaps.map((map) => (
                    <Card
                      key={map.id}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all",
                        currentMapId === map.id && "border-primary"
                      )}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => loadMindMap(map)}
                        >
                          <h3 className="font-semibold text-sm truncate">
                            {map.title}
                          </h3>
                          {map.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {map.description}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Updated {new Date(map.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMindMap(map.id);
                          }}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={exportAsJSON}
            className="gap-2 rounded-xl"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls className="bg-card border rounded-xl shadow-md" />
          <MiniMap
            className="bg-card border rounded-xl shadow-md"
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Panel position="top-right" className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 space-y-2 max-w-xs">
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={mindMapDescription}
                onChange={(e) => setMindMapDescription(e.target.value)}
                placeholder="Add description..."
                className="text-xs resize-none h-16"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input
                value={mindMapSubject}
                onChange={(e) => setMindMapSubject(e.target.value)}
                placeholder="e.g., Biology"
                className="text-xs"
              />
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Help overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Card className="max-w-md pointer-events-auto shadow-premium-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Create Your Mind Map
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Get started by clicking <strong>"Add Node"</strong> to create your first concept.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Drag nodes to reposition them</li>
                <li>• Click and drag from a node's edge to create connections</li>
                <li>• Use color coding to organize different topics</li>
                <li>• Save your work to access it later</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MindMap;
