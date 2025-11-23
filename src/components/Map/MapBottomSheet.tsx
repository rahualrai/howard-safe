import React from 'react';
import { Drawer } from 'vaul';
import type { MapMarker } from '@/components/GoogleMapComponent';
import { MarkerDetails } from './MarkerDetails';

interface MapBottomSheetProps {
    marker: MapMarker | null;
    onClose: () => void;
}

export const MapBottomSheet: React.FC<MapBottomSheetProps> = ({ marker, onClose }) => {
    if (!marker) return null;

    const isOpen = !!marker;

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
                    <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
                        <MarkerDetails marker={marker} />
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
