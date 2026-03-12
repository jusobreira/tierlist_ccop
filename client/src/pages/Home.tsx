import { useState, useMemo, useEffect, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, RotateCcw, Search, Check } from 'lucide-react';
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
    F: 'F'
  });
  const [editingTier, setEditingTier] = useState<TierKey | null>(null);
  const [tierListWidth, setTierListWidth] = useState(65);
  const [isResizing, setIsResizing] = useState(false);
  const [unrankedWidth, setUnrankedWidth] = useState(35);
  const [tierColumnsCount, setTierColumnsCount] = useState(2);
  const [unrankedColumnsCount, setUnrankedColumnsCount] = useState(2);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const dragStateRef = useRef<DragState>({ isDragging: false, startX: 0, startY: 0 });

  useEffect(() => {
    const calculateColumns = (width: number) => {
      const availableWidth = width - 120;
      const columnWidth = 100;
      const cols = Math.max(2, Math.floor(availableWidth / (columnWidth + 8)));
      return cols;
    };

    const handleResize = () => {
      const tierListElement = document.getElementById('tier-list-container');
      const unrankedElement = document.getElementById('unranked-container');
      
      if (tierListElement) {
        const tierWidth = tierListElement.offsetWidth;
        setTierColumnsCount(calculateColumns(tierWidth));
      }
      
      if (unrankedElement) {
        const unrankedWidth = unrankedElement.offsetWidth;
        setUnrankedColumnsCount(calculateColumns(unrankedWidth));
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    const tierListElement = document.getElementById('tier-list-container');
    const unrankedElement = document.getElementById('unranked-container');
    
    if (tierListElement) resizeObserver.observe(tierListElement);
    if (unrankedElement) resizeObserver.observe(unrankedElement);

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
    const newTierListWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newTierListWidth > 30 && newTierListWidth < 85) {
      setTierListWidth(newTierListWidth);
      setUnrankedWidth(100 - newTierListWidth);
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

  // NOVA LÓGICA DE DOWNLOAD COM CORREÇÃO DE CORES OKLCH
const handleDownloadTierList = async () => {
    const tierListElement = document.getElementById('tier-list-card');
    if (!tierListElement) return;

    try {
      // O html-to-image lida com oklch e fontes modernas automaticamente
      const dataUrl = await toPng(tierListElement, {
        quality: 0.95,
        backgroundColor: '#1e293b', // Cor de fundo do card (Slate 800)
        cacheBust: true,
        style: {
          // Garante que o elemento clonado mantenha o arredondamento e bordas
          borderRadius: '12px',
        },
        // Filtra elementos que você não queira no print (opcional)
        filter: (node) => {
          const exclusionClasses = ['download-btn', 'reset-btn'];
          return !exclusionClasses.some(cls => 
            (node as HTMLElement).classList?.contains(cls)
          );
        }
      });

      // Processo de salvar o arquivo
      const link = document.createElement('a');
      link.download = `tier-list-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Houve um erro técnico ao gerar a imagem. Tente usar um navegador moderno (Chrome/Edge).');
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
          <div className="flex-1 overflow-y-auto p-4">
            <Card id="tier-list-card" className="p-6 bg-slate-800 border-slate-700 shadow-xl m-4 flex-1 flex flex-col overflow-hidden h-fit max-w-full">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">Your Tier List</h2>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadTierList} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700">
                    <Download size={16} className="mr-2" /> PNG
                  </Button>
                  <Button onClick={handleReset} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700">
                    <RotateCcw size={16} className="mr-2" /> Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                {tiers.map(tier => (
                  <div key={tier} className="flex gap-4">
                    <div
                      className="w-20 flex items-center justify-center rounded font-bold text-white text-xl flex-shrink-0 relative group cursor-pointer"
                      style={{ backgroundColor: TIER_COLORS[tier].bg }}
                      onClick={() => setEditingTier(tier)}
                    >
                      {editingTier === tier ? (
                        <input
                          autoFocus
                          type="text"
                          value={tierLabels[tier]}
                          onChange={(e) => setTierLabels({ ...tierLabels, [tier]: e.target.value })}
                          onBlur={() => setEditingTier(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingTier(null)}
                          className="w-full text-center bg-slate-900 text-white border border-slate-500 rounded px-2 py-1"
                          maxLength={10}
                        />
                      ) : (
                        <span>{tierLabels[tier]}</span>
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
            </Card>
          </div>
        </div>

        {/* Resizer */}
        <div onMouseDown={handleMouseDown} className="w-1.5 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0" />

        {/* Unranked Section */}
        <div id="unranked-container" style={{ width: `${unrankedWidth}%`, transition: isResizing ? 'none' : 'width 0.2s' }} className="flex flex-col overflow-hidden">
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
              className="overflow-y-auto flex-1"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${unrankedColumnsCount}, minmax(0, 1fr))`,
                gap: '0.5rem',
                alignContent: 'start'
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

      {/* Stats */}
      {tierList.length > 0 && (
        <div className="px-6 pb-6">
          <Card className="p-4 bg-slate-800 border-slate-700">
            <div className="grid grid-cols-5 gap-4 text-center">
              {tiers.map(tier => (
                <div key={tier}>
                  <div className="text-lg font-bold text-white mb-1" style={{ color: TIER_COLORS[tier].bg }}>
                    {getCharactersByTier(tier).length}
                  </div>
                  <div className="text-xs text-slate-400">{TIER_COLORS[tier].name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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
