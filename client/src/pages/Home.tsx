import { useState, useMemo, useEffect, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, RotateCcw, Search, Maximize2 } from 'lucide-react';import html2canvas from 'html2canvas';// 1. ADIÇÃO: Proxy para evitar erro de imagem em branco no download
const getProxiedImageUrl = (url: string) => {
  if (url.includes('wixstatic')) return url; // Imagens Wix costumam aceitar CORS
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp`;
};
export default function Home() {
  const [tierList, setTierList] = useState<{characterId: string, tier: TierKey}[]>([]);
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Função de tela cheia
  const [tierListWidth, setTierListWidth] = useState(70);
  
  // 2. ADIÇÃO: Lógica de download que respeita o seu layout
  const handleDownloadTierList = async () => {
    const element = document.getElementById('tier-list-container');
    if (!element) return;    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#020617', // slate-950
      });      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `one-piece-tier-list.png`;
      link.click();    } catch (err) {
      console.error(err);
      alert("Erro ao baixar. Verifique as imagens.");
    }
  };  const handleDragStart = (id: string) => setDraggedCharacter(id);
  const handleDrop = (tier: TierKey) => {
    if (!draggedCharacter) return;
    setTierList(prev => [...prev.filter(i => i.characterId !== draggedCharacter), { characterId: draggedCharacter, tier }]);
    setDraggedCharacter(null);
  };  const filteredCharacters = useMemo(() => {
    return CHARACTERS.filter(char => 
      !tierList.find(t => t.characterId === char.id) &&
      (char.name.toLowerCase().includes(searchQuery.toLowerCase()) || char.code.includes(searchQuery))
    );
  }, [tierList, searchQuery]);  const tiers: TierKey[] = ['S', 'A', 'B', 'C', 'F'];  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* MODAL DE TELA CHEIA (Restaurado) */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white"><X size={32} /></button>
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95" alt="Preview" />
        </div>
      )}      <div className="max-w-[1800px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-black italic tracking-tighter">ONE PIECE TIER MAKER</h1>
          <div className="flex gap-2">
            <Button onClick={handleDownloadTierList} variant="default" className="bg-indigo-600 hover:bg-indigo-700">
              <Download size={18} className="mr-2" /> Exportar PNG
            </Button>
            <Button variant="outline" onClick={() => setTierList([])} className="border-slate-800">
              <RotateCcw size={18} />
            </Button>
          </div>
        </header>        <div className="flex flex-col lg:flex-row gap-6">
          {/* TIER LIST - LADO ESQUERDO */}
          <div style={{ width: `${tierListWidth}%` }} className="transition-all duration-300">
            <Card id="tier-list-container" className="bg-slate-900 border-slate-800 p-4">
              <div className="flex flex-col gap-2">
                {tiers.map(tier => (
                  <div key={tier} className="flex gap-2 min-h-[110px]">
                    <div 
                      className="w-24 flex items-center justify-center rounded text-2xl font-bold shadow-lg"
                      style={{ backgroundColor: TIER_COLORS[tier].bg, color: '#000' }}
                    >
                      {tier}                    </div>
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(tier)}
                      className="flex-1 bg-slate-950/40 rounded border-2 border-dashed border-slate-800 p-2 flex flex-wrap gap-2"                    >
                      {tierList.filter(i => i.tier === tier).map(item => {
                        const char = CHARACTERS.find(c => c.id === item.characterId);
                        return char ? (
                          <div key={char.id} className="group relative w-20 h-28 bg-slate-900 rounded border border-slate-800 overflow-hidden">
                            {/* 3. ADIÇÃO: Imagem com Proxy e CrossOrigin */}
                            <img 
                              src={getProxiedImageUrl(char.image)} 
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover" 
                              alt={char.name} 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                              <button onClick={() => setTierList(prev => prev.filter(p => p.characterId !== char.id))} className="self-end text-red-500">
                                <X size={16} />
                              </button>
                              <button onClick={() => setSelectedImage(char.image)} className="self-center text-white">
                                <Maximize2 size={20} />
                              </button>                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* SELEÇÃO - LADO DIREITO */}
          <div className="flex-1">
            <Card className="bg-slate-900 border-slate-800 p-4 h-[85vh] flex flex-col">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Filtrar líderes..." 
                  className="w-full bg-slate-950 border-slate-800 rounded-md py-2 pl-10 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>              <div className="grid grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {filteredCharacters.map(char => (
                  <div 
                    key={char.id}
                    draggable
                    onDragStart={() => handleDragStart(char.id)}
                    className="group relative aspect-[3/4] bg-slate-950 rounded border border-slate-800 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all overflow-hidden"
                  >
                    <img 
                      src={getProxiedImageUrl(char.image)} 
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover" 
                      alt={char.name}                     />
                    <button 
                      onClick={() => setSelectedImage(char.image)}
                      className="absolute bottom-1 right-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Largura da Tier List</label>
                <input 
                  type="range" min="40" max="100" 
                  value={tierListWidth} 
                  onChange={(e) => setTierListWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>    </div>
  );
}
