import { useState, useMemo, useEffect, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, RotateCcw, Search, Check } from 'lucide-react';

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

  // Calcular número de colunas baseado na largura disponível
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
    dragStateRef.current = { isDragging: false, startX: 0, startY: 0 };
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTier = (tier: TierKey) => {
    if (!draggedCharacter) return;

    const filtered = tierList.filter(item => item.characterId !== draggedCharacter);
    setTierList([...filtered, { characterId: draggedCharacter, tier }]);
    setDraggedCharacter(null);
  };

  const handleRemoveFromTier = (characterId: string) => {
    setTierList(tierList.filter(item => item.characterId !== characterId));
  };

  const handleReset = () => {
    setTierList([]);
  };

  const handleCardClick = (e: React.MouseEvent, characterId: string) => {
    // Verificar se foi um clique simples (não drag)
    const clickDuration = Date.now();
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

  const getCharactersByTier = (tier: TierKey) => {
    return tierList
      .filter(item => item.tier === tier)
      .map(item => CHARACTERS.find(c => c.id === item.characterId))
      .filter(Boolean);
  };

  const unrankedCharacters = useMemo(() => {
    return CHARACTERS.filter(
      char => !tierList.find(item => item.characterId === char.id)
    );
  }, [tierList]);

  const filteredCharacters = useMemo(() => {
    return unrankedCharacters.filter(char => {
      const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           char.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [unrankedCharacters, searchQuery]);

  const selectedCharacter = CHARACTERS.find(c => c.id === selectedCharacterId);

  const tiers: TierKey[] = ['S', 'A', 'B', 'C', 'F'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-6">
        <h1 className="text-4xl font-bold text-white mb-2">
          One Piece Leader Tier List
        </h1>
        <p className="text-slate-400">
          Drag and drop cards to rank your favorite leaders
        </p>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 flex gap-0 relative overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Tier List */}
        <div 
          id="tier-list-container"
          style={{ width: `${tierListWidth}%`, transition: isResizing ? 'none' : 'width 0.2s' }}
          className={`flex flex-col overflow-hidden ${isResizing ? 'no-select' : ''}`}
        >
          <Card className="p-6 bg-slate-800 border-slate-700 shadow-xl m-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Your Tier List</h2>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset
              </Button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              {tiers.map(tier => (
                <div key={tier} className="flex gap-4">
                  {/* Tier Label */}
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

                  {/* Tier Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnTier(tier)}
                    className="flex-1 bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 hover:border-slate-500 transition-colors p-3 min-h-[140px] flex flex-wrap gap-2 items-start content-start overflow-y-auto"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${tierColumnsCount}, minmax(0, 1fr))`,
                      alignContent: 'start'
                    }}
                  >
                    {getCharactersByTier(tier).length === 0 ? (
                      <div className="col-span-full w-full h-full flex items-center justify-center text-slate-500 text-sm">
                        Drop cards here
                      </div>
                    ) : (
                      getCharactersByTier(tier).map(character => (
                        <div
                          key={character!.id}
                          className="relative group flex-shrink-0 w-full cursor-pointer"
                          draggable
                          onDragStart={(e) => handleDragStart(e, character!.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleCardClick(e, character!.id)}
                        >
                          <div className="relative w-full h-[140px] overflow-hidden rounded-md border-2 border-slate-600 hover:border-slate-400 transition-all cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl hover:scale-105">
                            <img
                              src={character!.image}
                              alt={character!.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="140"%3E%3Crect fill="%23374151" width="100" height="140"/%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromTier(character!.id);
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X size={14} />
                          </button>
                          <div className="text-xs text-slate-300 mt-1 text-center truncate leading-tight">
                            {character!.name}
                          </div>
                          <div className="text-xs text-slate-500 text-center leading-tight">
                            {character!.code}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 resizer ${isResizing ? 'active' : ''}`}
        />

        {/* Sidebar - Unranked Characters */}
        <div 
          id="unranked-container"
          style={{ width: `${unrankedWidth}%`, transition: isResizing ? 'none' : 'width 0.2s' }}
          className={`flex flex-col overflow-hidden ${isResizing ? 'no-select' : ''}`}
        >
          <Card className="p-4 bg-slate-800 border-slate-700 shadow-xl m-4 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4 flex-shrink-0">
              Unranked ({filteredCharacters.length})
            </h3>

            {/* Search Bar */}
            <div className="mb-4 relative flex-shrink-0">
              <Search size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-500"
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
                  className="p-1 bg-slate-700 hover:bg-slate-600 rounded cursor-grab active:cursor-grabbing transition-colors border border-slate-600 hover:border-slate-500 hover:scale-105 hover:shadow-lg"
                >
                  <div className="relative w-full h-[140px] overflow-hidden rounded-md mb-1">
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="140"%3E%3Crect fill="%23374151" width="100" height="140"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 text-center truncate leading-tight">
                    {character.name}
                  </div>
                  <div className="text-xs text-slate-500 text-center leading-tight">
                    {character.code}
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
                  <div
                    className="text-lg font-bold text-white mb-1"
                    style={{ color: TIER_COLORS[tier].bg }}
                  >
                    {getCharactersByTier(tier).length}
                  </div>
                  <div className="text-xs text-slate-400">
                    {TIER_COLORS[tier].name}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Fullscreen Modal */}
      {selectedCharacter && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCharacterId(null)}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCharacterId(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors z-10"
            >
              <X size={32} />
            </button>

            {/* Image Container */}
            <div className="relative w-full flex-1 overflow-hidden rounded-lg shadow-2xl">
              <img
                src={selectedCharacter.image}
                alt={selectedCharacter.name}
                className="w-full h-full object-contain bg-slate-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="140"%3E%3Crect fill="%23374151" width="100" height="140"/%3E%3C/svg%3E';
                }}
              />
            </div>

            {/* Info Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-b-lg p-6 mt-4">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedCharacter.name}</h2>
              <p className="text-slate-400 text-lg mb-6">{selectedCharacter.code}</p>
              
              {/* Tier Buttons */}
              <div className="flex gap-3 justify-center flex-wrap">
                {tiers.map(tier => (
                  <button
                    key={tier}
                    onClick={() => handleAddToTierFromModal(tier)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-110 hover:shadow-lg active:scale-95"
                    style={{
                      backgroundColor: TIER_COLORS[tier].bg,
                      color: tier === 'A' ? '#000' : '#fff'
                    }}
                  >
                    <Check size={18} />
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
