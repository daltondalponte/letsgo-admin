"use client"
import React from 'react';
import { Button, ButtonGroup } from '@nextui-org/react';

export type AspectRatio = '1:1' | '9:16' | '4:5';

interface AspectRatioSelectorProps {
  selectedAspect: AspectRatio;
  onAspectChange: (aspect: AspectRatio) => void;
  className?: string;
}

const aspectRatios: { value: AspectRatio; label: string; ratio: number }[] = [
  { value: '1:1', label: 'Quadrado', ratio: 1 },
  { value: '4:5', label: 'Retrato', ratio: 0.8 },
  { value: '9:16', label: 'Stories', ratio: 0.5625 },
];

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedAspect,
  onAspectChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Proporção da Imagem
      </label>
      <ButtonGroup className="w-full">
        {aspectRatios.map((aspect) => (
          <Button
            key={aspect.value}
            variant={selectedAspect === aspect.value ? 'solid' : 'bordered'}
            color={selectedAspect === aspect.value ? 'primary' : 'default'}
            className="flex-1"
            onPress={() => onAspectChange(aspect.value)}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className="border-2 border-current rounded"
                style={{
                  width: '20px',
                  height: `${20 * aspect.ratio}px`,
                }}
              />
              <span className="text-xs">{aspect.label}</span>
            </div>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}; 