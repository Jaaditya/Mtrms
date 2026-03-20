import { QRCodeSVG } from "qrcode.react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Share2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface TableQrDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: any;
    restaurantSlug: string;
}

export function TableQrDialog({ open, onOpenChange, table, restaurantSlug }: TableQrDialogProps) {
    const qrRef = useRef<SVGSVGElement>(null);

    if (!table) return null;

    // Construct the backend URL from the environment or default
    const backendBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace("/api", "");
    const orderUrl = `${backendBaseUrl}/menu/${restaurantSlug}/${table.id}`;

    const downloadQR = () => {
        const svg = qrRef.current;
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 80;
            if (ctx) {
                // White background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR
                ctx.drawImage(img, 20, 20);

                // Add Text
                ctx.fillStyle = "black";
                ctx.font = "bold 20px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`${table.table_number}`, canvas.width / 2, img.height + 40);
                ctx.font = "14px Arial";
                ctx.fillText("Scan to Order", canvas.width / 2, img.height + 65);

                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR_${table.table_number}.png`;
                downloadLink.href = `${pngFile}`;
                downloadLink.click();
                toast.success("QR Code downloaded");
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Table QR Code</DialogTitle>
                    <DialogDescription>
                        Scan this code at <strong>{table.table_number}</strong> to open the digital menu.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-border shadow-inner">
                    <QRCodeSVG
                        ref={qrRef}
                        value={orderUrl}
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                    <div className="mt-4 text-center">
                        <p className="text-xl font-bold text-black">{table.table_number}</p>
                        <p className="text-sm text-gray-500 uppercase tracking-widest">{restaurantSlug}</p>
                    </div>
                </div>

                <DialogFooter className="grid grid-cols-2 gap-2 sm:justify-start">
                    <Button variant="outline" className="gap-2" onClick={downloadQR}>
                        <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handlePrint}>
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
