'use client';

import { useState, DragEvent } from 'react';

interface Deal {
    id: string;
    title: string;
    amount: number;
    stage: string;
    [key: string]: any;
}

interface DraggableDealCardProps {
    deal: Deal;
    onDragStart: (dealId: string, currentStage: string) => void;
    onDragEnd: () => void;
    onClick?: () => void;
}

export function DraggableDealCard({ deal, onDragStart, onDragEnd, onClick }: DraggableDealCardProps) {
    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
        onDragStart(deal.id, deal.stage);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className="card bg-surface hover:shadow-md cursor-grab active:cursor-grabbing group"
            style={{ cursor: 'grab' }}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-sm">
                    {deal.company_name || 'Company'}
                </span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">{deal.title}</h4>
            <div className="text-lg font-bold text-text-primary mb-3">
                ${deal.amount.toLocaleString()}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                <span className="text-[10px] text-text-tertiary">
                    {deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : 'Today'}
                </span>
                {deal.probability && (
                    <span className="text-[10px] text-text-tertiary">
                        {deal.probability}% probability
                    </span>
                )}
            </div>
        </div>
    );
}

interface DroppableStageColumnProps {
    stage: string;
    deals: Deal[];
    onDrop: (dealId: string, newStage: string) => void;
    onDealClick?: (deal: Deal) => void;
    draggedDealId: string | null;
    draggedFromStage: string | null;
}

export function DroppableStageColumn({
    stage,
    deals,
    onDrop,
    onDealClick,
    draggedDealId,
    draggedFromStage,
}: DroppableStageColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        if (draggedDealId && draggedFromStage !== stage) {
            onDrop(draggedDealId, stage);
        }
    };

    const getStageColor = (stageName: string) => {
        switch (stageName.toLowerCase()) {
            case 'won':
            case 'closed':
                return 'bg-green-500';
            case 'negotiation':
            case 'committed':
                return 'bg-purple-500';
            case 'lost':
                return 'bg-red-500';
            default:
                return 'bg-blue-400';
        }
    };

    return (
        <div
            className={`flex-none w-80 rounded-lg flex flex-col h-full max-h-full transition-all ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-background'
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-gray-50 rounded-t-lg sticky top-0">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`} />
                    <h3 className="font-semibold text-sm text-text-primary uppercase tracking-wide">
                        {stage}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {deals.length}
                    </span>
                </div>
            </div>

            {/* Cards Container */}
            <div className="p-3 space-y-3 overflow-y-auto flex-1 bg-gray-50/50">
                {deals.length === 0 && !isDragOver && (
                    <div className="text-center py-8 text-sm text-text-tertiary">
                        Drop deals here
                    </div>
                )}
                {deals.map((deal) => (
                    <div key={deal.id} style={{ opacity: draggedDealId === deal.id ? 0.5 : 1 }}>
                        <DraggableDealCard
                            deal={deal}
                            onDragStart={() => { }}
                            onDragEnd={() => { }}
                            onClick={() => onDealClick?.(deal)}
                        />
                    </div>
                ))}
                {isDragOver && (
                    <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 text-center text-blue-600 bg-blue-50">
                        Drop here to move to {stage}
                    </div>
                )}
            </div>
        </div>
    );
}

export function useDealDragDrop(onDealMove: (dealId: string, newStage: string) => Promise<void>) {
    const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
    const [draggedFromStage, setDraggedFromStage] = useState<string | null>(null);

    const handleDragStart = (dealId: string, currentStage: string) => {
        setDraggedDealId(dealId);
        setDraggedFromStage(currentStage);
    };

    const handleDragEnd = () => {
        setDraggedDealId(null);
        setDraggedFromStage(null);
    };

    const handleDrop = async (dealId: string, newStage: string) => {
        await onDealMove(dealId, newStage);
        handleDragEnd();
    };

    return {
        draggedDealId,
        draggedFromStage,
        handleDragStart,
        handleDragEnd,
        handleDrop,
    };
}
