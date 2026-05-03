"use client";

import { useState } from "react";
import { Share2, Copy, Check, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/types";

interface BuildShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  buildName?: string;
}

export default function BuildShareDialog({
  open,
  onOpenChange,
  cart,
  buildName = "My PC Build",
}: BuildShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate a shareable URL with build data
  const generateShareUrl = () => {
    const buildData = cart.map(item => ({
      id: item.id,
      variantId: item.selectedVariant?.id,
      quantity: item.quantity,
    }));
    
    const encoded = btoa(JSON.stringify(buildData));
    return `${window.location.origin}/builds/shared?data=${encoded}`;
  };

  const shareUrl = generateShareUrl();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Build link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Check out my PC build: ${buildName}`);
    const body = encodeURIComponent(
      `I wanted to share my PC build with you!\n\n` +
      `Build: ${buildName}\n` +
      `Components: ${cart.length} items\n` +
      `View the full build here: ${shareUrl}\n\n` +
      `Total Price: ₹${cart.reduce((sum, item) => 
        sum + (item.selectedVariant?.price || 0) * item.quantity, 0
      ).toLocaleString("en-IN")}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleExportBuild = () => {
    const buildData = {
      name: buildName,
      created: new Date().toISOString(),
      components: cart.map(item => ({
        name: item.name,
        category: item.category,
        brand: item.product?.brand?.name,
        price: item.selectedVariant?.price,
        quantity: item.quantity,
        specs: item.specs,
      })),
      totalPrice: cart.reduce((sum, item) => 
        sum + (item.selectedVariant?.price || 0) * item.quantity, 0
      ),
    };

    const blob = new Blob([JSON.stringify(buildData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildName.replace(/\s+/g, "_")}_build.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Build exported!",
      description: "Build data has been downloaded as JSON file.",
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: buildName,
          text: `Check out my PC build with ${cart.length} components!`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyLink();
    }
  };

  const totalPrice = cart.reduce((sum, item) => 
    sum + (item.selectedVariant?.price || 0) * item.quantity, 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Build
          </DialogTitle>
          <DialogDescription>
            Share your PC build with others via link or export the build data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Build Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{buildName}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{cart.length} components</p>
              <p className="font-semibold text-gray-900">
                Total: ₹{totalPrice.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Share Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-xs"
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Anyone with this link can view your build
            </p>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleNativeShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handleShareEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>

          {/* Export Options */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleExportBuild}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Build Data (JSON)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
