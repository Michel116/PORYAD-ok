
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import type { BoxType } from '@/lib/types';
import { useTerminals } from '@/context/terminals-context';
import { useUser } from '@/context/user-context';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, QrCode, Type, Box, MapPin } from 'lucide-react';
import jsQR from 'jsqr';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { SectionSelector } from './section-selector';
import { useIsMobile } from '@/hooks/use-mobile';

type Step = 'boxType' | 'placement' | 'serial';
type SerialInputTab = 'manual' | 'scan';

interface AddTerminalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTerminal: (serialNumber: string, boxType: BoxType, sectionId?: string) => boolean;
  dialogType: 'regular' | 'rental';
}

export function AddTerminalDialog({
  isOpen,
  onOpenChange,
  onAddTerminal,
  dialogType,
}: AddTerminalDialogProps) {
  const { toast } = useToast();
  const { shelfSections, terminals } = useTerminals();
  const { user } = useUser();
  const isMobile = useIsMobile();
  
  const [step, setStep] = useState<Step>('boxType');
  const [isPlaced, setIsPlaced] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | undefined>();
  const [boxType, setBoxType] = useState<BoxType>('type_A');
  const [activeTab, setActiveTab] = useState<SerialInputTab>('manual');
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  const dialogTitle = dialogType === 'rental' ? "Добавить арендный терминал" : "Добавить терминал на склад";

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
    }
  }, []);


  const resetAndClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Full reset when dialog is fully closed
  useEffect(() => {
    if (!isOpen) {
        stopCamera();
        setTimeout(() => {
            setStep('boxType');
            setIsPlaced(false);
            setSelectedSection(undefined);
            setBoxType('type_A');
            setActiveTab(isMobile ? 'scan' : 'manual');
            setSerialNumber('');
            setError(null);
            setHasCameraPermission(true);
        }, 300); // Delay to allow animation to finish
    }
  }, [isOpen, stopCamera, isMobile]);

  
  const availableSections = useMemo(() => {
    return shelfSections.filter(section => {
      const isRentalTier = section.tier === 'Аренда';
      if (dialogType === 'rental' && !isRentalTier) return false;
      if (dialogType === 'regular' && isRentalTier) return false;

      if (section.currentBoxType === null || section.terminals.length === 0) return true;
      
      if (section.currentBoxType === boxType) {
        const capacity = section.capacity[boxType];
        if (!capacity) return false;
        const totalCells = capacity.rows * capacity.cols;
        return section.terminals.length < totalCells;
      }
      
      return false;
    });
  }, [shelfSections, boxType, dialogType]);
  
  useEffect(() => {
    if (selectedSection && !availableSections.some(s => s.id === selectedSection)) {
        setSelectedSection(undefined);
    }
  }, [boxType, availableSections, selectedSection]);


  const validateSerialNumber = (sn: string) => {
    setError(null);
    const trimmedSn = sn.trim();
    if (!trimmedSn) return false;

    if (terminals.some(t => t.serialNumber === trimmedSn)) {
      setError('Терминал с таким серийным номером уже существует.');
      return false;
    }
    
    if (dialogType === 'rental' && !trimmedSn.startsWith('1792')) {
      setError('S/N арендного терминала должен начинаться с "1792".');
      return false;
    }
    
    if (dialogType === 'regular' && trimmedSn.startsWith('1792')) {
      setError('Этот S/N зарезервирован для арендных терминалов.');
      return false;
    }

    return true;
  };

  const handleManualAdd = () => {
    if (validateSerialNumber(serialNumber)) {
      const success = onAddTerminal(serialNumber.trim(), boxType, isPlaced ? selectedSection : undefined);
      if (success) {
        toast({
          title: 'Терминал добавлен',
          description: `Терминал ${serialNumber.trim()} был успешно добавлен.`,
        });
        resetAndClose();
      } else {
         setError('Терминал с таким серийным номером уже существует.');
      }
    }
  };
  
  const handleScan = useCallback((scannedSerialNumber: string) => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    setSerialNumber(scannedSerialNumber);

    if (!validateSerialNumber(scannedSerialNumber)) {
      setActiveTab('manual');
      return;
    }
    
    const success = onAddTerminal(scannedSerialNumber, boxType, isPlaced ? selectedSection : undefined);
    if(success) {
       toast({
          title: 'Терминал добавлен',
          description: `Терминал ${scannedSerialNumber} был успешно добавлен.`,
        });
      resetAndClose();
    } else {
       setError('Терминал с таким серийным номером уже существует.');
       setActiveTab('manual');
    }
  }, [onAddTerminal, boxType, isPlaced, selectedSection, toast, resetAndClose]);

  const scanQrCode = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code && code.data && code.data.trim() !== '') {
                    handleScan(code.data);
                    return; // Stop scanning once a code is found
                }
            } catch (e) {
                console.error("jsQR error:", e);
            }
        }
    }
    animationFrameRef.current = requestAnimationFrame(scanQrCode);
}, [handleScan]);

  
  const getCameraPermission = useCallback(async () => {
    if (streamRef.current) {
      return;
    }
    
    const processStream = (stream: MediaStream) => {
        setHasCameraPermission(true);
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                animationFrameRef.current = requestAnimationFrame(scanQrCode);
            };
        }
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        processStream(stream);
    } catch (err) {
        console.warn("Could not get 'environment' camera, trying default.", err);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            processStream(stream);
        } catch (finalErr) {
            console.error("Camera access denied:", finalErr);
            setHasCameraPermission(false);
            stopCamera();
        }
    }
  }, [scanQrCode, stopCamera]);
  
  
  useEffect(() => {
    if (isOpen && step === 'serial' && activeTab === 'scan') {
        getCameraPermission();
    } else {
        stopCamera();
    }
  }, [isOpen, step, activeTab, getCameraPermission, stopCamera]);

   useEffect(() => {
    if (isMobile !== undefined) {
      setActiveTab(isMobile ? 'scan' : 'manual');
    }
  }, [isMobile]);


  const renderStepContent = () => {
    switch (step) {
      case 'placement':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="is-placed-switch" className="font-medium cursor-pointer">Терминал уже на стеллаже?</Label>
                <p className="text-sm text-muted-foreground">Укажите, если терминал уже физически размещен.</p>
              </div>
              <Switch id="is-placed-switch" checked={isPlaced} onCheckedChange={setIsPlaced} />
            </div>
            {isPlaced && (
               <SectionSelector
                    availableSections={availableSections}
                    selectedSectionId={selectedSection}
                    onSelectSection={setSelectedSection}
                    boxType={boxType}
                />
            )}
          </div>
        );
      case 'boxType':
        return (
          <div className="space-y-4">
            <Label>Тип коробки</Label>
            <RadioGroup value={boxType} onValueChange={(v: any) => setBoxType(v)} className="grid grid-cols-2 gap-2 sm:gap-4">
              <Label htmlFor="type_A" className={cn("border rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors", boxType === 'type_A' && 'bg-primary/10 border-primary')}>
                <RadioGroupItem value="type_A" id="type_A" className="sr-only"/>
                <Box className="h-8 w-8"/>
                <span className="font-bold">Маленькая (A)</span>
              </Label>
              <Label htmlFor="type_B" className={cn("border rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors", boxType === 'type_B' && 'bg-primary/10 border-primary')}>
                <RadioGroupItem value="type_B" id="type_B" className="sr-only"/>
                <Box className="h-10 w-10"/>
                <span className="font-bold">Большая (B)</span>
              </Label>
            </RadioGroup>
          </div>
        );
      case 'serial':
        return (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SerialInputTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual"><Type className="w-4 h-4 mr-2"/>Ручной ввод</TabsTrigger>
              <TabsTrigger value="scan"><QrCode className="w-4 h-4 mr-2"/>Сканировать</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="space-y-3 pt-4">
              <Label htmlFor="serial-number">Серийный номер (S/N)</Label>
              <Input
                id="serial-number"
                value={serialNumber}
                onChange={(e) => {
                    setSerialNumber(e.target.value);
                    if (error) validateSerialNumber(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                placeholder={dialogType === 'rental' ? "например, 1792..." : "например, 1702..."}
                autoFocus
              />
              {error && <p className="text-sm text-destructive px-1">{error}</p>}
            </TabsContent>
            <TabsContent value="scan">
               {!hasCameraPermission && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Доступ к камере заблокирован</AlertTitle>
                    <AlertDescription>
                      Пожалуйста, предоставьте доступ к камере в настройках вашего браузера, чтобы использовать сканер.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
                    <video ref={videoRef} playsInline className={cn("w-full h-full object-cover", !hasCameraPermission && "hidden")} />
                    {hasCameraPermission && <div className="absolute inset-0 border-4 border-white/50 rounded-lg pointer-events-none" />}
                </div>
            </TabsContent>
          </Tabs>
        );
    }
  };

  const steps: Step[] = ['boxType', 'placement', 'serial'];
  const currentStepIndex = steps.indexOf(step);
  const stepIcons = { placement: MapPin, boxType: Box, serial: QrCode };
  const stepTitles = { placement: 'Размещение', boxType: 'Тип коробки', serial: 'Серийный номер' };

  const handleNext = () => {
    setError(null);
    if (currentStepIndex < steps.length - 1) {
      if (step === 'placement' && isPlaced && !selectedSection) {
          setError("Пожалуйста, выберите секцию.");
          return;
      }
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };
  
   useEffect(() => {
    if (isOpen) {
      setStep('boxType');
    }
  }, [isOpen]);

  const canAdd = user?.role === 'Administrator' || user?.role === 'Verifier' || user?.role === 'User';
  if (!canAdd) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
           <DialogDescription>
            Шаг {currentStepIndex + 1} из {steps.length}: {stepTitles[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center my-4">
            <div className="flex items-center w-full max-w-xs">
                {steps.map((s, index) => {
                    const Icon = stepIcons[s];
                    const isCompleted = currentStepIndex > index;
                    const isActive = currentStepIndex === index;
                    return (
                        <React.Fragment key={s}>
                           <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10",
                                isCompleted ? "bg-primary text-primary-foreground" :
                                isActive ? "bg-primary/20 border-2 border-primary text-primary" :
                                "bg-muted text-muted-foreground border"
                            )}>
                                <Icon className="w-4 h-4"/>
                            </div>
                           {index < steps.length - 1 && (
                             <div className={cn(
                                "flex-auto border-t-2 transition-colors -mx-1",
                                isCompleted ? 'border-primary' : 'border-border'
                             )}></div>
                           )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>

        <div className="py-4 min-h-[220px]">
          {renderStepContent()}
           {error && step === 'placement' && <p className="text-sm text-destructive px-1 pt-2">{error}</p>}
        </div>

        <DialogFooter className="flex justify-between w-full">
            {step !== 'boxType' ? (
                <Button variant="ghost" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4"/>Назад</Button>
            ) : <div></div> }

            {step !== 'serial' ? (
                <Button onClick={handleNext} disabled={step === 'placement' && isPlaced && !selectedSection}>
                    Далее <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            ) : (
                <Button onClick={handleManualAdd} disabled={activeTab !== 'manual' || !serialNumber.trim()}>Добавить</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
