import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Merge, Split, Loader2, Trash2, UserCircle2, Edit2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableDialog } from "@/components/dialogs/TableDialog";
import { FloorDialog } from "@/components/dialogs/FloorDialog";
import { TableQrDialog } from "@/components/dialogs/TableQrDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

interface Table {
  id: number;
  table_number: string;
  capacity: number | string;
  shape: string;
  status: string;
  floor_id: number | string;
  assigned_waiter_id?: number | string | null;
  is_merged?: boolean;
  merged_with_id?: number | null;
  merged_tables?: Table[];
  order_index: number;
}

interface Floor {
  id: number;
  name: string;
  order_index: number;
  tables?: Table[];
}

interface Staff {
  id: number;
  name: string;
  role: string;
}

const statusConfig: Record<TableStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "border-success/50 bg-success/5" },
  occupied: { label: "Occupied", className: "border-primary/50 bg-primary/5" },
  reserved: { label: "Reserved", className: "border-info/50 bg-info/5" },
  cleaning: { label: "Cleaning", className: "border-cleaning/50 bg-cleaning/5" },
};

const statusColors: Record<TableStatus, string> = {
  available: "bg-success",
  occupied: "bg-primary",
  reserved: "bg-info",
  cleaning: "bg-cleaning",
};

function SortableTable({
  table,
  onEdit,
  selectedTableIds,
  onSplit,
  onDelete,
  onShowQr,
  onAssignWaiter,
  staff,
}: {
  table: Table;
  onEdit: (t: Table) => void;
  selectedTableIds: number[];
  onSplit: (parentId: number) => void;
  onDelete: (id: number) => void;
  onShowQr: (t: Table) => void;
  onAssignWaiter: (id: number, waiterId: string) => void;
  staff: Staff[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  const config =
    statusConfig[table.status as TableStatus] || statusConfig.available;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(table)}
      className={cn(
        "border-2 p-4 flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all relative group touch-none",
        config.className,
        table.shape === "round"
          ? "rounded-full aspect-square"
          : "rounded-lg aspect-square",
        selectedTableIds.includes(table.id) &&
        "ring-2 ring-primary ring-offset-2",
        table.merged_with_id && "opacity-60 border-dashed"
      )}
    >
      {table.merged_with_id && (
        <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full border-2 border-background">
          <Merge className="h-3 w-3" />
        </div>
      )}

      <span className="text-sm font-bold">{table.table_number}</span>
      <span className="text-[10px] text-muted-foreground">
        {table.capacity} seats
      </span>

      {table.merged_tables && table.merged_tables.length > 0 && (
        <span className="text-[9px] font-semibold text-primary">
          +{table.merged_tables.length} merged
        </span>
      )}

      <div
        className="mt-2 w-full px-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Select
          value={table.assigned_waiter_id?.toString() || "unassigned"}
          onValueChange={(val) => onAssignWaiter(table.id, val)}
        >
          <SelectTrigger className="h-6 text-[10px] bg-background/50 border-primary/20">
            <SelectValue placeholder="Assign Waiter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="unassigned"
              className="text-[10px] text-muted-foreground"
            >
              Unassigned
            </SelectItem>
            {staff.map((s: Staff) => (
              <SelectItem
                key={s.id}
                value={s.id.toString()}
                className="text-[10px]"
              >
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {(table.is_merged || table.merged_with_id) && (
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6"
            title="Split Tables"
            onClick={(e) => {
              e.stopPropagation();
              onSplit(table.is_merged ? table.id : (table.merged_with_id as number));
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Split className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="icon"
          variant="destructive"
          className="h-6 w-6"
          title="Delete Table"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(table.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        <button
          className="p-1 rounded hover:bg-secondary/50"
          onClick={(e) => {
            e.stopPropagation();
            onShowQr(table);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="QR Code"
        >
          <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export default function FloorsAndTables() {
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [floorDialogOpen, setFloorDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string>("");
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const restaurantSlug = localStorage.getItem("tenant_slug") || "default";

  const { data: floors = [], isLoading } = useQuery<Floor[]>({
    queryKey: ["floors"],
    queryFn: () => api.get("/floors").then((res) => res.data),
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff", "waiter"],
    queryFn: () => api.get("/users?role=waiter").then((res) => res.data),
  });

  // Set default active floor when data loads
  useEffect(() => {
    if (floors.length > 0 && !activeFloorId) {
      setActiveFloorId(String(floors[0].id));
    }
  }, [floors, activeFloorId]);

  const handleAdd = () => { setEditingTable(null); setDialogOpen(true); };
  const handleEdit = (t: Table) => {
    if (mergeMode) {
      toggleTableSelection(t.id);
      return;
    }
    setEditingTable({
      ...t,
      capacity: String(t.capacity),
      floor_id: String(t.floor_id)
    });
    setDialogOpen(true);
  };

  const handleAddFloor = () => { setEditingFloor(null); setFloorDialogOpen(true); };
  const handleEditFloor = (f: Floor) => { setEditingFloor(f); setFloorDialogOpen(true); };

  const handleDeleteFloor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this floor? All tables on this floor will also be deleted.")) return;
    try {
      await api.delete(`/floors/${id}`);
      toast.success("Floor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      if (activeFloorId === String(id)) setActiveFloorId("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const toggleTableSelection = (id: number) => {
    setSelectedTableIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (selectedTableIds.length < 2) {
      toast.error("Select at least 2 tables to merge.");
      return;
    }

    try {
      await api.post("/tables/merge", {
        parent_id: selectedTableIds[0],
        table_ids: selectedTableIds
      });
      toast.success("Tables merged successfully");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setMergeMode(false);
      setSelectedTableIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Merge failed");
    }
  };

  const handleSplit = async (parentId: number) => {
    try {
      await api.post("/tables/split", { parent_id: parentId });
      toast.success("Tables split successfully");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Split failed");
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success("Table deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const handleAssignWaiter = async (tableId: number, waiterId: string) => {
    try {
      await api.post(`/tables/${tableId}/assign-waiter`, { waiter_id: waiterId === 'unassigned' ? null : Number(waiterId) });
      toast.success(waiterId === 'unassigned' ? "Waiter unassigned" : "Waiter assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Assignment failed");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const table = floors
      .flatMap((f) => f.tables || [])
      .find((t) => t.id === active.id);
    if (table) setActiveTable(table);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTable(null);

    if (!over || active.id === over.id) return;

    const floor = floors.find((f) =>
      f.tables?.some((t) => t.id === active.id)
    );
    if (!floor || !floor.tables) return;

    const oldIndex = floor.tables.findIndex((t) => t.id === active.id);
    const newIndex = floor.tables.findIndex((t) => t.id === over.id);

    const newTables = arrayMove(floor.tables, oldIndex, newIndex);

    // Optimistically update local state
    queryClient.setQueryData(["floors"], (old: Floor[] | undefined) => {
      if (!old) return old;
      return old.map((f) => {
        if (f.id === floor.id) {
          return { ...f, tables: newTables };
        }
        return f;
      });
    });

    try {
      await api.post("/tables/reorder", {
        table_ids: newTables.map((t) => t.id),
      });
      toast.success("Table order updated");
    } catch (error: any) {
      toast.error("Failed to update table order");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const currentFloorId = activeFloorId || (floors.length > 0 ? String(floors[0].id) : "");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Floors & Tables</h1>
            <p className="text-sm text-muted-foreground">Visual floor plan and table management</p>
          </div>
          <div className="flex gap-2">
            {mergeMode ? (
              <>
                <Button size="sm" variant="outline" onClick={() => { setMergeMode(false); setSelectedTableIds([]); }}>Cancel</Button>
                <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={handleMerge}>Confirm Merge ({selectedTableIds.length})</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="gap-2 text-sm" onClick={handleAddFloor}><Layers className="h-4 w-4" /> Add Floor</Button>
                <Button size="sm" variant="outline" className="gap-2 text-sm" onClick={() => setMergeMode(true)}><Merge className="h-3.5 w-3.5" /> Merge Mode</Button>
                <Button size="sm" className="gap-2 gradient-primary text-primary-foreground border-0" onClick={handleAdd}>
                  <Plus className="h-4 w-4" /> Add Table
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {Object.entries(statusConfig).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded-full", statusColors[key as TableStatus])} />
              <span className="text-xs text-muted-foreground">{val.label}</span>
            </div>
          ))}
        </div>

        {floors.length > 0 ? (
          <Tabs value={currentFloorId} onValueChange={setActiveFloorId}>
            <TabsList className="bg-secondary h-auto flex-wrap p-1">
              {floors.map((f: Floor) => (
                <TabsTrigger
                  key={f.id}
                  value={String(f.id)}
                  className="group relative px-4 py-2"
                >
                  <span className="mr-6">{f.name} ({f.tables?.length || 0})</span>
                  <div className="absolute right-1 hidden group-hover:flex gap-1">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleEditFloor(f); }}
                      className="p-1 hover:bg-primary/20 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3 text-primary" />
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleDeleteFloor(f.id); }}
                      className="p-1 hover:bg-destructive/20 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {floors.map((f: Floor) => (
              <TabsContent key={f.id} value={String(f.id)} className="mt-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={f.tables?.map((t) => t.id) || []}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {f.tables?.map((table: Table) => (
                        <SortableTable
                          key={table.id}
                          table={table}
                          onEdit={handleEdit}
                          selectedTableIds={selectedTableIds}
                          onSplit={handleSplit}
                          onDelete={handleDeleteTable}
                          onShowQr={(t) => {
                            setEditingTable(t);
                            setQrDialogOpen(true);
                          }}
                          onAssignWaiter={handleAssignWaiter}
                          staff={staff}
                        />
                      ))}
                      {(!f.tables || f.tables.length === 0) && (
                        <div className="col-span-full glass-card p-8 text-center text-muted-foreground">
                          <p className="text-sm">
                            No tables on this floor - Add tables to get started
                          </p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeTable ? (
                      <div className="border-2 p-4 flex flex-col items-center justify-center gap-1 rounded-lg aspect-square bg-background border-primary/50 shadow-xl opacity-90">
                        <span className="text-sm font-bold">
                          {activeTable.table_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {activeTable.capacity} seats
                        </span>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="glass-card p-12 text-center text-muted-foreground">
            <p className="mb-4">No floors configured. Please add floors to start organizing your tables.</p>
            <Button onClick={handleAddFloor} className="gap-2">
              <Layers className="h-4 w-4" /> Add Your First Floor
            </Button>
          </div>
        )}
      </div>

      <TableDialog open={dialogOpen} onOpenChange={setDialogOpen} table={editingTable} />
      <FloorDialog open={floorDialogOpen} onOpenChange={setFloorDialogOpen} floor={editingFloor} />
      <TableQrDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        table={editingTable}
        restaurantSlug={restaurantSlug}
      />
    </AdminLayout>
  );
}
