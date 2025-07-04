import { useState } from "react";
import type { ChangeEvent } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoredPlatform } from "@/lib/types";

interface AddPlatformModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (platform: StoredPlatform) => void;
}

export const AddPlatformModal = ({
    isOpen,
    onClose,
    onSave,
}: AddPlatformModalProps) => {
    const [platformType, setPlatformType] = useState<
        "binance" | "multiversx" | ""
    >("");
    const [binanceApiKey, setBinanceApiKey] = useState("");
    const [binanceApiSecret, setBinanceApiSecret] = useState("");
    const [multiversxWalletAddress, setMultiversxWalletAddress] = useState("");
    const [multiversxWalletName, setMultiversxWalletName] = useState("");

    const handleSave = () => {
        let platformData: StoredPlatform | undefined;
        if (platformType === "binance") {
            platformData = {
                type: "binance",
                name: "Binance",
                apiKey: binanceApiKey,
                apiSecret: binanceApiSecret,
            };
        } else if (platformType === "multiversx") {
            platformData = {
                type: "multiversx",
                name: multiversxWalletName,
                walletAddress: multiversxWalletAddress,
            };
        }
        if (platformData) {
            onSave(platformData);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Platform</DialogTitle>
                    <DialogDescription>
                        Select a platform and enter your credentials.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select
                        onValueChange={(value: "binance" | "multiversx") =>
                            setPlatformType(value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="binance">Binance</SelectItem>
                            <SelectItem value="multiversx">
                                MultiversX
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {platformType === "binance" && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="apiKey" className="text-right">
                                    API Key
                                </Label>
                                <Input
                                    id="apiKey"
                                    value={binanceApiKey}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) => setBinanceApiKey(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="apiSecret"
                                    className="text-right"
                                >
                                    API Secret
                                </Label>
                                <Input
                                    id="apiSecret"
                                    type="password"
                                    value={binanceApiSecret}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) => setBinanceApiSecret(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </>
                    )}

                    {platformType === "multiversx" && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="walletName"
                                    className="text-right"
                                >
                                    Wallet Name
                                </Label>
                                <Input
                                    id="walletName"
                                    value={multiversxWalletName}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) =>
                                        setMultiversxWalletName(e.target.value)
                                    }
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="walletAddress"
                                    className="text-right"
                                >
                                    Wallet Address
                                </Label>
                                <Input
                                    id="walletAddress"
                                    value={multiversxWalletAddress}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) =>
                                        setMultiversxWalletAddress(
                                            e.target.value
                                        )
                                    }
                                    className="col-span-3"
                                />
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
