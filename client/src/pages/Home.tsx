import { useState, useMemo, useEffect, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, RotateCcw, Search } from 'lucide-react';
import html2canvas from 'html2canvas';

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

// Função auxiliar para garantir que a URL da imagem permita CORS via Proxy
const getCORSImageUrl = (url: string) => {
  if (url.startsWith('data:')) return url;
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

export default function Home() {
  const [tierList, setTierList] = useState<TierListItem[]>([]);
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierLabels, setTierLabels] = useState<TierLabel>({
    S: 'S', A: 'A', B: 'B', C: 'C', F: 'F'
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
      return Math.max(2, Math.floor(availableWidth / (columnWidth + 8)));
    };

    const handleResize = () => {
      const tierListElement = document.getElementById('tier-list-container');
      const unrankedElement = document.getElementById('unranked-container');
      if (tierListElement) setTierColumnsCount(calculateColumns(tierListElement.offsetWidth));
      if (unrankedElement) setUnrankedColumnsCount(calculateColumns(unrankedElement.offsetWidth));
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
    setTimeout(() => { dragStateRef.current = { isDragging: false, startX: 0, startY: 0 }; }, 100);
  };

  const handleDownloadTierList = async () => {
    const tierListElement = document.getElementById('tier-list-card');
    if (!tierListElement) return;

    try {
      // Pequeno delay para garantir que o DOM está estável
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tierListElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false, // Importante: false para permitir exportação
        backgroundColor: '#1e293b',
        logging: false,
        onclone: (clonedDoc) => {
          // Garante que elementos com scroll apareçam por inteiro no print
          const element = clonedDoc.getElementById('tier-list-card');
          if (element) element.style.height = 'auto';
        }
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `one-piece-tier-list-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Houve um erro ao processar as imagens. Tente novamente.');
    }
  };

  const handleDropOnTier = (tier: TierKey) => {
    if (!draggedCharacter) return;
    const filtered = tierList.filter(item => item.characterId !== draggedCharacter);
    setTierList([...filtered, { characterId: draggedCharacter, tier }]);
    setDraggedCharacter(null);
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
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-6">
        <h1 className="text-4xl font-bold text-white mb-2">One Piece Leader Tier List</h1>
        <p className="text-slate-400">Rank your favorite leaders</p>
      </div>

      <div className="flex-1 flex gap-0 relative overflow-hidden" 
           onMouseMove={(e) => isResizing && (() => {
             const rect = e.currentTarget.getBoundingClientRect();
             const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
             if (newWidth > 30 && newWidth < 85) {
               setTierListWidth(newWidth);
               setUnrankedWidth(100 - newWidth);
             }
           })()} 
           onMouseUp={() => setIsResizing(false)}>
        
        {/* LADO ESQUERDO: TIER LIST */}
        <div id="tier-list-container" style={{ width: `${tierListWidth}%` }} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <Card id="tier-list-card" className="p-6 bg-slate-800 border-slate-700 shadow-xl m-4 h-fit">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Tier List</h2>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadTierList} variant="outline" size="sm" className="text-slate-300 border-slate-600">
                    <Download size={16} className="mr-2" /> PNG
                  </Button>
                  <Button onClick={() => setTierList([])} variant="outline" size="sm" className="text-slate-300 border-slate-600">
                    <RotateCcw size={16} className="mr-2" /> Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {tiers.map(tier => (
                  <div key={tier} className="flex gap-4">
                    <div className="w-20 flex items-center justify-center rounded font-bold text-white text-xl flex-shrink-0 cursor-pointer"
                         style={{ backgroundColor: TIER_COLORS[tier].bg }}
                         onClick={() => setEditingTier(tier)}>
                      {editingTier === tier ? (
                        <input autoFocus value={tierLabels[tier]} 
                               onChange={(e) => setTierLabels({...tierLabels, [tier]: e.target.value})}
                               onBlur={() => setEditingTier(null)}
                               className="w-full text-center bg-slate-900 text-white" />
                      ) : (<span>{tierLabels[tier]}</span>)}
                    </div>

                    <div onDragOver={(e) => e.preventDefault()}
                         onDrop={() => handleDropOnTier(tier)}
                         className="flex-1 bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-600 p-3 min-h-[140px] grid gap-2"
                         style={{ gridTemplateColumns: `repeat(${tierColumnsCount}, minmax(0, 1fr))` }}>
                      {getCharactersByTier(tier).map(character => (
                        <div key={character!.id} className="relative group cursor-pointer" draggable 
                             onDragStart={(e) => handleDragStart(e, character!.id)}
                             onClick={() => setSelectedCharacterId(character!.id)}>
                          <div className="relative w-full h-[140px] overflow-hidden rounded-md border-2 border-slate-600">
                            <img src={getCORSImageUrl(character!.image)} 
                                 crossOrigin="anonymous"
                                 alt={character!.name} 
                                 className="w-full h-full object-contain" />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setTierList(prev => prev.filter(i => i.characterId !== character!.id)); }}
                                  className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} className="text-white" />
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

        {/* RESIZER */}
        <div onMouseDown={() => setIsResizing(true)} className="w-1.5 bg-slate-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0" />

        {/* LADO DIREITO: UNRANKED */}
        <div id="unranked-container" style={{ width: `${unrankedWidth}%` }} className="flex flex-col overflow-hidden">
          <Card className="p-4 bg-slate-800 border-slate-700 m-4 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4">Unranked ({filteredCharacters.length})</h3>
            <input type="text" placeholder="Search..." value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-4 text-white mb-4" />
            
            <div className="overflow-y-auto flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${unrankedColumnsCount}, minmax(0, 1fr))` }}>
              {filteredCharacters.map(character => (
                <div key={character.id} draggable onDragStart={(e) => handleDragStart(e, character.id)}
                     onClick={() => setSelectedCharacterId(character.id)}
                     className="p-1 bg-slate-700 hover:bg-slate-600 rounded cursor-grab border border-slate-600 transition-transform hover:scale-105">
                  <div className="relative w-full h-[140px] overflow-hidden rounded-md mb-1">
                    <img src={getCORSImageUrl(character.image)} 
                         crossOrigin="anonymous"
                         alt={character.name} 
                         className="w-full h-full object-contain" />
                  </div>
                  <div className="text-[10px] text-slate-300 text-center truncate">{character.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL (Simplificado para o exemplo) */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCharacterId(null)}>
          <div className="bg-slate-800 p-6 rounded-lg max-w-sm w-full" onClick={e => e.stopPropagation()}>
             <img src={getCORSImageUrl(selectedCharacter.image)} crossOrigin="anonymous" className="w-full rounded mb-4" />
             <div className="grid grid-cols-5 gap-2">
               {tiers.map(t => (
                 <button key={t} className="p-2 rounded font-bold text-white" style={{backgroundColor: TIER_COLORS[t].bg}}
                         onClick={() => {
                           setTierList(prev => [...prev.filter(i => i.characterId !== selectedCharacter.id), {characterId: selectedCharacter.id, tier: t}]);
                           setSelectedCharacterId(null);
                         }}>{t}</button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
