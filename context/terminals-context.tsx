

"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Terminal, ShelfSection, BoxType, Shipment, TerminalStatus, VerificationRequest, VerificationRequestStatus } from '@/lib/types';
import { terminals as initialTerminals, shelfSections as initialShelfSectionsData, shipments as initialShipments, verificationRequests as initialVerificationRequests } from '@/lib/mock-data';
import { useUser } from './user-context';
import { format } from 'date-fns';

interface TerminalsContextType {
  terminals: Terminal[];
  shelfSections: ShelfSection[];
  shipments: Shipment[];
  contragents: string[];
  verificationRequests: VerificationRequest[];
  addTerminal: (serialNumber: string, boxType: BoxType, sectionId?: string) => boolean;
  shipTerminal: (terminalId: string, contragent: string) => void;
  rentTerminal: (terminalId: string, contragent: string) => void;
  returnTerminal: (terminalId: string) => void;
  updateTerminalVerification: (terminalId: string, verificationDate: string, verifiedUntil: string) => void;
  updateShipmentDate: (terminalId: string, newShippingDate: string) => void;
  verifyTerminal: (terminalId: string, status: 'verified' | 'pending' | 'not_verified', verificationDate?: string, verifiedUntil?: string) => void;
  moveTerminal: (terminal: Terminal, newSectionId: string) => void;
  addContragent: (name: string) => boolean;
  deleteContragent: (name: string) => void;
  createVerificationRequest: (terminalIds: string[], customId?: string) => void;
  processVerificationRequest: (requestId: string) => void;
  updateVerificationRequestDetails: (requestId: string, newId: string, newDate: string) => void;
}

const TerminalsContext = createContext<TerminalsContextType | undefined>(undefined);

export function TerminalsProvider({ children }: { children: ReactNode }) {
  const [terminals, setTerminals] = useState<Terminal[]>(initialTerminals);
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [shelfSections, setShelfSections] = useState<ShelfSection[]>([]);
  const [manualContragents, setManualContragents] = useState<string[]>(['ООО "СтройИнвест"', 'АО "ТехноСтрой"']);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(initialVerificationRequests);
  const { user } = useUser();

  useEffect(() => {
    // This effect rebuilds the shelfSections array whenever terminals change.
    // It ensures that the terminals within each section are always up-to-date.
    const sectionsMap = new Map<string, ShelfSection>();
    // Initialize map with all sections from mock data
    initialShelfSectionsData.forEach(s => sectionsMap.set(s.id, { ...s, terminals: [] }));
  
    // Populate terminals into their respective sections
    terminals.forEach(t => {
      if (t.location) {
        const section = sectionsMap.get(t.location.sectionId);
        if (section) {
          section.terminals.push(t);
        }
      }
    });

    // Also, update the currentBoxType for each section based on the terminals within it
    sectionsMap.forEach(section => {
      if (section.terminals.length > 0) {
        section.currentBoxType = section.terminals[0].boxType;
      } else {
        // If a section becomes empty, reset its box type
        const initialSection = initialShelfSectionsData.find(s => s.id === section.id);
        section.currentBoxType = initialSection?.currentBoxType ?? null;
      }
    });
  
    setShelfSections(Array.from(sectionsMap.values()));
  }, [terminals]);


  useEffect(() => {
    const now = new Date();
    // Reset time part for accurate date comparison
    now.setHours(0, 0, 0, 0);

    const checkAndUpdateTerminals = () => {
        setTerminals(currentTerminals => {
            let hasChanged = false;
            const updatedTerminals = currentTerminals.map(t => {
                if (t.status === 'verified' && t.verifiedUntil) {
                    const verifiedUntilDate = new Date(t.verifiedUntil);
                    verifiedUntilDate.setHours(0,0,0,0);
                    
                    if (verifiedUntilDate < now) {
                        hasChanged = true;
                        return {
                            ...t,
                            status: 'expired' as TerminalStatus,
                            history: [
                                ...(t.history || []),
                                {
                                    date: new Date().toISOString(),
                                    event: 'Статус изменен на "Просрочен" из-за истечения срока поверки',
                                    responsible: 'Система'
                                }
                            ]
                        };
                    }
                }
                return t;
            });

            if (hasChanged) {
                return updatedTerminals;
            }
            return currentTerminals;
        });
    };
    
    // Check on mount
    checkAndUpdateTerminals();
    // Optionally, you can set an interval to check periodically
    // const interval = setInterval(checkAndUpdateTerminals, 1000 * 60 * 60); // Check every hour
    // return () => clearInterval(interval);
}, []); // Empty dependency array means this runs once on mount


  const contragents = useMemo(() => {
    const allContragents = shipments.map(s => s.contragent);
    const rentalContragents = terminals
        .filter(t => t.status === 'rented')
        .flatMap(t => t.history.filter(h => h.event.includes('аренду')))
        .map(h => h.event.split(':')[1]?.trim())
        .filter((c): c is string => !!c);

    return [...new Set([...allContragents, ...rentalContragents, ...manualContragents])];
  }, [shipments, terminals, manualContragents]);

  const addContragent = (name: string): boolean => {
    const trimmedName = name.trim();
    if (trimmedName && !contragents.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        setManualContragents(prev => [...prev, trimmedName]);
        return true;
    }
    return false;
  };
  
  const deleteContragent = (name: string) => {
    setManualContragents(prev => prev.filter(c => c.toLowerCase() !== name.toLowerCase()));
  };

 const moveTerminal = (terminalToMove: Terminal, newSectionId: string) => {
    const fullSections = shelfSections.length > 0 ? shelfSections : initialShelfSectionsData.map(s => ({ ...s, terminals: [] }));
    const targetSection = fullSections.find(s => s.id === newSectionId);
    
    if (!targetSection) {
        console.error("Target section not found for moveTerminal.");
        return;
    }

    const boxTypeForCapacity = targetSection.currentBoxType || terminalToMove.boxType;
    const capacity = targetSection.capacity[boxTypeForCapacity];
    const totalCells = capacity.rows * capacity.cols;
    
    const terminalsInTargetSection = terminals.filter(t => t.location?.sectionId === newSectionId);
    const occupiedPositions = new Set(terminalsInTargetSection.map(t => t.position));

    let targetPosition: number | undefined;
    for (let i = 0; i < totalCells; i++) {
        if (!occupiedPositions.has(i)) {
            targetPosition = i;
            break;
        }
    }

    if (targetPosition === undefined) {
        console.error("No available cells in the target section.");
        return;
    }
    
    const isExisting = terminals.some(t => t.serialNumber === terminalToMove.serialNumber);

    const updatedTerminal = {
        ...terminalToMove,
        location: { sectionId: newSectionId, cell: targetPosition! + 1 },
        position: targetPosition,
        history: [
            ...(terminalToMove.history || []),
            { 
              date: new Date().toISOString(), 
              event: terminalToMove.location ? `Перемещен со стеллажа ${terminalToMove.location.sectionId} на ${newSectionId}` : `Размещен на стеллаже ${newSectionId}`,
              responsible: user.name 
            }
        ]
    };
    
    setTerminals(prevTerminals => {
        if (isExisting) {
            return prevTerminals.map(t => t.serialNumber === terminalToMove.serialNumber ? updatedTerminal : t);
        } else {
            return [...prevTerminals, updatedTerminal];
        }
    });
};


  const addTerminal = (serialNumber: string, boxType: BoxType, sectionId?: string): boolean => {
    const trimmedSerialNumber = serialNumber.trim();
    if (!trimmedSerialNumber) {
      return false;
    }
    if (terminals.some(t => t.serialNumber === trimmedSerialNumber)) {
        return false;
    }

    const isRental = trimmedSerialNumber.startsWith('1792');
    const initialEvent = isRental ? 'Добавлен в арендный фонд' : 'Добавлен на склад';

    const newTerminal: Terminal = {
        serialNumber: trimmedSerialNumber,
        model: isRental ? 'Инспектор 1 (Аренда)' : 'Инспектор 1',
        status: 'not_verified',
        boxType: boxType,
        lastVerificationDate: null,
        verifiedUntil: null,
        history: [{ date: new Date().toISOString(), event: initialEvent, responsible: user.name }],
    };
    
    if (sectionId) {
      moveTerminal(newTerminal, sectionId);
    } else {
      setTerminals(prev => [...prev, newTerminal]);
    }

    return true;
  };
  
  const shipTerminal = (terminalId: string, contragent: string) => {
    const terminalToShip = terminals.find(t => t.serialNumber === terminalId);
    if (!terminalToShip) return;

    addContragent(contragent);
    
    const statusBeforeShipment = terminalToShip.status;
    const newStatus: TerminalStatus = (statusBeforeShipment === 'pending' || statusBeforeShipment === 'not_verified' || statusBeforeShipment === 'expired') ? 'awaits_verification_after_shipping' : 'shipped';
    const shippingDate = new Date().toISOString();

    const newShipment: Shipment = {
      terminalId,
      shippingDate: shippingDate,
      contragent,
      statusBeforeShipment: statusBeforeShipment,
    };
    
    setShipments(prevShipments => [newShipment, ...prevShipments]);

    setTerminals(prevTerminals =>
      prevTerminals.map(t => {
        if (t.serialNumber === terminalId) {
          const historyEventText = statusBeforeShipment === 'expired'
            ? `Отгружен контрагенту (с истекшим сроком поверки): ${contragent}`
            : `Отгружен контрагенту: ${contragent}`;

          return {
            ...t,
            status: newStatus,
            location: undefined,
            position: undefined,
            history: [
              ...(t.history || []),
              {
                date: shippingDate,
                event: historyEventText,
                responsible: user.name,
              },
            ],
          };
        }
        return t;
      })
    );
  };
  
  const rentTerminal = (terminalId: string, contragent: string) => {
    const terminalToRent = terminals.find(t => t.serialNumber === terminalId);
    if (!terminalToRent) return;
    
    addContragent(contragent);

    const rentingDate = new Date().toISOString();
    const historyEventText = terminalToRent.status === 'expired'
        ? `Передан в аренду контрагенту (с истекшим сроком поверки): ${contragent}`
        : `Передан в аренду контрагенту: ${contragent}`;


    setTerminals(prevTerminals =>
      prevTerminals.map(t => {
        if (t.serialNumber === terminalId) {
          return {
            ...t,
            status: 'rented',
            location: undefined,
            position: undefined,
            history: [
              ...(t.history || []),
              {
                date: rentingDate,
                event: historyEventText,
                responsible: user.name,
              },
            ],
          };
        }
        return t;
      })
    );
  };
  
  const returnTerminal = (terminalId: string) => {
    setTerminals(prevTerminals => {
      return prevTerminals.map(t => {
        if (t.serialNumber === terminalId && t.status === 'rented') {
          // Filter history to keep only verification and creation events
          const keptHistory = t.history.filter(h => 
            h.event.includes('Поверен') || h.event.includes('Добавлен в арендный фонд')
          );

          return {
            ...t,
            status: 'not_verified',
            returnedFrom: undefined, // Clear who it was returned from
            location: undefined,
            position: undefined,
            history: [
              ...keptHistory,
              {
                date: new Date().toISOString(),
                event: `Возвращен на арендный склад`,
                responsible: user.name
              }
            ]
          };
        }
        return t;
      });
    });
  };
  
  const updateShipmentDate = (terminalId: string, newShippingDate: string) => {
     setShipments(prev => prev.map(s => 
        s.terminalId === terminalId ? { ...s, shippingDate: newShippingDate } : s
     ));
     
     setTerminals(prev => prev.map(t => {
         if (t.serialNumber === terminalId) {
             const newHistory = t.history.map(h => {
                 if (h.event.startsWith('Отгружен контрагенту:')) {
                     return { ...h, date: newShippingDate };
                 }
                 return h;
             });
             return { ...t, history: newHistory };
         }
         return t;
     }));
  }

  const updateTerminalVerification = (terminalId: string, verificationDate: string, verifiedUntil: string) => {
    setTerminals(prevTerminals => 
        prevTerminals.map(t => {
            if (t.serialNumber === terminalId) {
                const newStatus = t.status === 'awaits_verification_after_shipping' ? 'shipped' : 'verified';
                return {
                    ...t,
                    status: newStatus,
                    lastVerificationDate: verificationDate,
                    verifiedUntil: verifiedUntil,
                    history: [...(t.history || []), { date: new Date().toISOString(), event: 'Данные о поверке внесены (после отгрузки)', responsible: user.name }]
                };
            }
            return t;
        })
    );
  };

  const verifyTerminal = (terminalId: string, status: 'verified' | 'pending' | 'not_verified', verificationDate?: string, verifiedUntil?: string) => {
    setTerminals(prevTerminals => 
        prevTerminals.map(t => {
            if (t.serialNumber === terminalId) {
                if (status === 'verified' && verificationDate && verifiedUntil) {
                    return {
                        ...t,
                        status: 'verified',
                        lastVerificationDate: verificationDate,
                        verifiedUntil: verifiedUntil,
                        history: [...(t.history || []), { date: new Date().toISOString(), event: 'Поверен', responsible: user.name }]
                    };
                }
                if (status === 'pending') {
                    return {
                        ...t,
                        status: 'pending',
                        history: [...(t.history || []), { date: new Date().toISOString(), event: 'Переведен в статус "Ожидание"', responsible: user.name }]
                    }
                }
                if (status === 'not_verified') {
                    return {
                        ...t,
                        status: 'not_verified',
                        history: [...(t.history || []), { date: new Date().toISOString(), event: 'Статус сброшен на "Не поверен"', responsible: user.name }]
                    }
                }
            }
            return t;
        })
    );
  };

  const createVerificationRequest = (terminalIds: string[], customId?: string) => {
    const now = new Date();
    const newId = customId || `Заявка №${String(verificationRequests.length + 1).padStart(4, '0')}`;
    const newRequest: VerificationRequest = {
        id: newId,
        status: 'pending',
        createdAt: now.toISOString(),
        terminalIds,
        createdBy: user.name,
    };
    
    setVerificationRequests(prev => [newRequest, ...prev]);
    
    // Update status of terminals included in the request
    setTerminals(prev => prev.map(t => {
        if (terminalIds.includes(t.serialNumber)) {
            return {
                ...t,
                status: 'pending',
                history: [...(t.history || []), { date: new Date().toISOString(), event: `Добавлен в заявку на поверку ${newRequest.id}`, responsible: user.name }]
            };
        }
        return t;
    }));
  };

  const processVerificationRequest = (requestId: string) => {
      setVerificationRequests(prev => prev.map(r => {
          if (r.id === requestId) {
              return { ...r, status: 'processed', processedAt: new Date().toISOString() };
          }
          return r;
      }));
  };

  const updateVerificationRequestDetails = (requestId: string, newId: string, newDate: string) => {
    setVerificationRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, id: newId, createdAt: newDate } : r
    ));
    // Also update terminal history if ID changed
    if (requestId !== newId) {
        setTerminals(prev => prev.map(t => {
            const historyEntry = t.history.find(h => h.event.includes(requestId));
            if (historyEntry) {
                return {
                    ...t,
                    history: t.history.map(h => 
                        h.event.includes(requestId) ? { ...h, event: `Добавлен в заявку на поверку ${newId}` } : h
                    )
                }
            }
            return t;
        }));
    }
  };
  
    const value = {
      terminals,
      shelfSections,
      shipments,
      contragents,
      addContragent,
      deleteContragent,
      addTerminal,
      shipTerminal,
      rentTerminal,
      returnTerminal,
      updateTerminalVerification,
      updateShipmentDate,
      verifyTerminal,
      moveTerminal,
      verificationRequests,
      createVerificationRequest,
      processVerificationRequest,
      updateVerificationRequestDetails,
    };


  return (
    <TerminalsContext.Provider value={value}>
      {children}
    </TerminalsContext.Provider>
  );
}

export function useTerminals() {
  const context = useContext(TerminalsContext);
  if (context === undefined) {
    throw new Error('useTerminals must be used within a TerminalsProvider');
  }
  return context;
}
