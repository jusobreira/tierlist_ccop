import { useState, useMemo, useEffect, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, RotateCcw, Search, Check, Pencil } from 'lucide-react';
import { toPng } from 'html-to-image';

// FUNÇÃO AUXILIAR PARA O PROXY (Essencial para o download não sair em branco)
const getProxiedImageUrl = (url: string) => {
  if (!url) return '';
  const sanitizedUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(sanitizedUrl)}&output=webp`;
};

interface TierListItem {
  characterId: string;
  tier: TierKey;
}

interface TierLabel {
  [key: string]: string;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
}

export default function Home() {
  const [tierList, setTierList] = useState<TierListItem[]>([]);
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierLabels, setTierLabels] = useState<TierLabel>({
    S: 'S',
    A: 'A',
    B: 'B',
    C: 'C',
    F: 'F',
  });
  const [editingTier, setEditingTier] = useState<TierKey | null>(null);
  const [tierListWidth, setTierListWidth] = useState(65);
  const [isResizing, setIsResizing] = useState(false);
  const [tierColumnsCount, setTierColumnsCount] = useState(2);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [tierListName, setTierListName] = useState('Your Tier List');
  const [editingName, setEditingName] = useState(false);
  const dragStateRef = useRef<DragState>({ isDragging: false, startX: 0, startY: 0 });

  useEffect(() => {
    const calculateColumns = (width: number) => {
      const availableWidth = width - 120;
      const columnWidth = 100;
      return Math.max(2, Math.floor(availableWidth / (columnWidth + 8)));
    };

    const handleResize = () => {
      const tierListElement = document.getElementById('tier-list-container');
      if (tierListElement) {
        setTierColumnsCount(calculateColumns(tierListElement.offsetWidth));
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    const tierListElement = document.getElementById('tier-list-container');
    if (tierListElement) resizeObserver.observe(tierListElement);

    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, characterId: string) => {
    dragStateRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };
    setDraggedCharacter(characterId);
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      dragStateRef.current = { isDragging: false, startX: 0, startY: 0 };
    }, 100);
  };

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newWidth > 30 && newWidth < 85) {
      setTierListWidth(newWidth);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDropOnTier = (tier: TierKey) => {
    if (!draggedCharacter) return;
    const filtered = tierList.filter(item => item.characterId !== draggedCharacter);
    setTierList([...filtered, { characterId: draggedCharacter, tier }]);
    setDraggedCharacter(null);
    dragStateRef.current = { isDragging: false, startX: 0, startY: 0 };
  };

  const handleRemoveFromTier = (characterId: string) => {
    setTierList(tierList.filter(item => item.characterId !== characterId));
  };

  const handleReset = () => setTierList([]);

  const handleCardClick = (e: React.MouseEvent, characterId: string) => {
    if (dragStateRef.current.isDragging) return;
    setTimeout(() => {
      if (!dragStateRef.current.isDragging) {
        setSelectedCharacterId(characterId);
      }
    }, 50);
  };

  const handleAddToTierFromModal = (tier: TierKey) => {
    if (!selectedCharacterId) return;
    const filtered = tierList.filter(item => item.characterId !== selectedCharacterId);
    setTierList([...filtered, { characterId: selectedCharacterId, tier }]);
    setSelectedCharacterId(null);
  };

  // Converte valor oklch para hex usando o canvas 2D do browser
  const oklchToHex = (oklchValue: string): string => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return oklchValue;
    ctx.fillStyle = oklchValue;
    return ctx.fillStyle; // Browser resolve para hex (#rrggbb)
  };

  // Substitui todas as ocorrências de oklch(...) nas stylesheets por hex
  const patchOklchInStylesheets = (): (() => void) => {
    const originals: { rule: CSSStyleRule; prop: string; value: string }[] = [];

    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          if (!(rule instanceof CSSStyleRule)) continue;
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            const value = rule.style.getPropertyValue(prop);
            if (value.includes('oklch')) {
              originals.push({ rule, prop, value });
              // Substitui cada oklch(...) no valor
              const patched = value.replace(/oklch\([^)]+\)/g, (match) => oklchToHex(match));
              rule.style.setProperty(prop, patched, rule.style.getPropertyPriority(prop));
            }
          }
        }
      } catch {
        // Cross-origin stylesheets — ignorar
      }
    }

    // Retorna função para restaurar os valores originais
    return () => {
      for (const { rule, prop, value } of originals) {
        rule.style.setProperty(prop, value);
      }
    };
  };

  // Converte img src para data URI inline para evitar bug de cache do html-to-image
  const inlineAllImages = async (container: HTMLElement): Promise<() => void> => {
    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    const originals: { img: HTMLImageElement; src: string }[] = [];

    await Promise.all(images.map(async (img) => {
      if (img.src.startsWith('data:')) return;
      originals.push({ img, src: img.src });
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const dataUri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        img.src = dataUri;
      } catch {
        // Mantém src original se falhar
      }
    }));

    return () => {
      for (const { img, src } of originals) {
        img.src = src;
      }
    };
  };

  const handleDownloadTierList = async () => {
    const exportEl = document.getElementById('tier-list-export');
    if (!exportEl) return;

    const restoreStylesheets = patchOklchInStylesheets();

    // Mostra watermark e esconde botões durante export
    const watermark = exportEl.querySelector('.watermark') as HTMLElement;
    if (watermark) watermark.style.display = 'block';

    // Salva scroll e remove overflow para capturar tudo
    const origScroll = exportEl.scrollTop;
    const origOverflow = exportEl.style.overflow;
    const origHeight = exportEl.style.height;
    exportEl.scrollTop = 0;
    exportEl.style.overflow = 'visible';
    exportEl.style.height = 'auto';

    // Converte todas as imagens para data URI inline (evita bug de cache)
    const restoreImages = await inlineAllImages(exportEl);

    try {
      const dataUrl = await toPng(exportEl, {
        quality: 0.95,
        backgroundColor: '#1e293b',
        filter: (node: Node) => {
          if (!(node instanceof HTMLElement)) return true;
          return !node.classList.contains('export-actions') && !node.classList.contains('edit-name-btn');
        }
      });

      const link = document.createElement('a');
      link.download = `tier-list-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Houve um erro técnico ao gerar a imagem. Tente usar um navegador moderno (Chrome/Edge).');
    } finally {
      restoreImages();
      if (watermark) watermark.style.display = '';
      exportEl.style.overflow = origOverflow;
      exportEl.style.height = origHeight;
      exportEl.scrollTop = origScroll;
      restoreStylesheets();
    }
  };


  const getCharactersByTier = (tier: TierKey) => {
    return tierList
      .filter(item => item.tier === tier)
      .map(item => CHARACTERS.find(c => c.id === item.characterId))
      .filter(Boolean);
  };

  const unrankedCharacters = useMemo(() => {
    return CHARACTERS.filter(char => !tierList.find(item => item.characterId === char.id));
  }, [tierList]);

  const filteredCharacters = useMemo(() => {
    return unrankedCharacters.filter(char => 
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unrankedCharacters, searchQuery]);

  const selectedCharacter = CHARACTERS.find(c => c.id === selectedCharacterId);
  const tiers: TierKey[] = ['S', 'A', 'B', 'C', 'F'];

  // Calcula largura da coluna de labels baseado no maior texto (max 20 chars por linha)
  const tierLabelWidth = useMemo(() => {
    const maxLen = Math.max(...Object.values(tierLabels).map(l => Math.min(l.length, 20)));
    return Math.max(5, maxLen * 0.65 + 1.5);
  }, [tierLabels]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-6">
        <h1 className="text-4xl font-bold text-white mb-2">One Piece Leader Tier List</h1>
        <p className="text-slate-400">Drag and drop cards to rank your favorite leaders</p>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex gap-0 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={() => {
          handleMouseUp();
          dragStateRef.current = { isDragging: false, startX: 0, startY: 0 };
        }}
      >
        {/* Tier List Section */}
        <div id="tier-list-container" style={{ width: `${tierListWidth}%`, transition: isResizing ? 'none' : 'width 0.2s' }} className="flex flex-col overflow-hidden">
          <div id="tier-list-export" className="flex-1 overflow-y-auto p-4">
            <Card className="p-6 bg-slate-800 border-slate-700 shadow-xl m-4 flex-1 flex flex-col h-fit">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {editingName ? (
                    <input
                      autoFocus
                      type="text"
                      value={tierListName}
                      onChange={(e) => setTierListName(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                      className="text-2xl font-bold text-white bg-slate-900 border border-slate-500 rounded px-2 py-1"
                      maxLength={30}
                    />
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white">{tierListName}</h2>
                      <button onClick={() => setEditingName(true)} className="edit-name-btn text-slate-400 hover:text-white">
                        <Pencil size={16} />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <img src="/marca.png" alt="Café com One Piece" className="watermark h-20 w-auto hidden" />
                  <div className="flex gap-2 export-actions">
                    <Button onClick={handleDownloadTierList} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700">
                      <Download size={16} className="mr-2" /> PNG
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700">
                      <RotateCcw size={16} className="mr-2" /> Reset
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                {tiers.map(tier => (
                  <div key={tier} className="flex gap-4">
                    <div
                      className="flex items-center justify-center rounded font-bold text-white flex-shrink-0 relative group cursor-pointer p-2 text-center"
                      style={{
                        backgroundColor: TIER_COLORS[tier].bg,
                        width: `${tierLabelWidth}rem`,
                        fontSize: tierLabels[tier].length > 5 ? '0.75rem' : '1.25rem',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                      onClick={() => setEditingTier(tier)}
                    >
                      {editingTier === tier ? (
                        <textarea
                          autoFocus
                          value={tierLabels[tier]}
                          onChange={(e) => setTierLabels({ ...tierLabels, [tier]: e.target.value })}
                          onBlur={() => setEditingTier(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingTier(null)}
                          className="w-full text-center bg-slate-900 text-white border border-slate-500 rounded px-1 py-1 resize-none"
                          maxLength={100}
                          rows={Math.min(4, Math.ceil(tierLabels[tier].length / 20) || 1)}
                        />
                      ) : (
                        <span className="block overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{tierLabels[tier]}</span>
                      )}
                    </div>

                    <div
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnTier(tier)}
                      className="flex-1 bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 p-3 min-h-[140px] flex flex-wrap gap-2 items-start content-start"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${tierColumnsCount}, minmax(0, 1fr))`,
                        alignContent: 'start'
                      }}
                    >
                      {getCharactersByTier(tier).map(character => (
                        <div
                          key={character!.id}
                          className="relative group flex-shrink-0 w-full cursor-pointer"
                          draggable
                          onDragStart={(e) => handleDragStart(e, character!.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleCardClick(e, character!.id)}
                        >
                          <div className="relative w-full h-[140px] overflow-hidden rounded-md border-2 border-slate-600 shadow-lg">
                            <img
                              src={getProxiedImageUrl(character!.image)}
                              crossOrigin="anonymous"
                              alt={character!.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromTier(character!.id); }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 z-10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              {tierList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-5 gap-4 text-center">
                    {tiers.map(tier => (
                      <div key={tier}>
                        <div className="text-lg font-bold text-white mb-1" style={{ color: TIER_COLORS[tier].bg }}>
                          {getCharactersByTier(tier).length}
                        </div>
                        <div className="text-xs text-slate-400">{tierLabels[tier]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Resizer */}
        <div onMouseDown={handleMouseDown} className="w-1.5 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0" />

        {/* Unranked Section */}
        <div id="unranked-container" style={{ width: `${100 - tierListWidth}%`, transition: isResizing ? 'none' : 'width 0.2s' }} className="flex flex-col overflow-hidden">
          <Card className="p-4 bg-slate-800 border-slate-700 shadow-xl m-4 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4">Unranked ({filteredCharacters.length})</h3>
            <div className="mb-4 relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div
              className="overflow-y-auto"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '0.5rem',
                alignContent: 'start',
                maxHeight: 'calc(150px * 6 + 0.5rem * 5)',
              }}
            >
              {filteredCharacters.map(character => (
                <div
                  key={character.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, character.id)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleCardClick(e, character.id)}
                  className="p-1 bg-slate-700 rounded cursor-grab active:cursor-grabbing border border-slate-600"
                >
                  <div className="relative w-full h-[140px] overflow-hidden rounded-md mb-1">
                    <img
                      src={getProxiedImageUrl(character.image)}
                      crossOrigin="anonymous"
                      alt={character.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCharacterId(null)}>
          <div className="relative max-w-md w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedCharacterId(null)} className="absolute -top-12 right-0 text-white hover:text-slate-300"><X size={32} /></button>
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg shadow-2xl mb-6">
              <img
                src={getProxiedImageUrl(selectedCharacter.image)}
                crossOrigin="anonymous"
                alt={selectedCharacter.name}
                className="w-full h-full object-contain bg-slate-900"
              />
            </div>
            <div className="grid grid-cols-5 gap-3 w-full">
              {tiers.map(tier => (
                <button
                  key={tier}
                  onClick={() => handleAddToTierFromModal(tier)}
                  className="aspect-square flex items-center justify-center rounded-lg font-bold text-white text-xl transition-all hover:scale-110 active:scale-95"
                  style={{ backgroundColor: TIER_COLORS[tier].bg, color: tier === 'A' ? '#000' : '#fff' }}
                >
                  {tier}
                </button>
              ))}
            </div>
            <div className="mt-6 text-center text-white">
              <h2 className="text-2xl font-bold">{selectedCharacter.name}</h2>
              <p className="text-slate-400">{selectedCharacter.code}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
