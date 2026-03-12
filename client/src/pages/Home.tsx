import { useState, useMemo, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'; 
import { X, Download, RotateCcw, Search } from 'lucide-react';
import html2canvas from 'html2canvas';

// FUNÇÃO CHAVE: Resolve o erro de download (CORS) usando um proxy gratuito
const getProxiedImageUrl = (url: string) => {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp`;
};

export default function Home() {
  const [tierList, setTierList] = useState<{characterId: string, tier: TierKey}[]>([]);
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierLabels] = useState<Record<string, string>>({
    S: 'S', A: 'A', B: 'B', C: 'C', F: 'F'
  });

  // Lógica de download com tratamento de imagem externa
  const handleDownloadTierList = async () => {
    const element = document.getElementById('tier-list-card');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,           // Essencial para imagens externas
        allowTaint: false,
        backgroundColor: '#0f172a', // Mantém o fundo escuro no print
        scale: 2,                 // Melhora a qualidade da imagem final
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById('tier-list-card');
          if (clonedCard) {
            clonedCard.style.height = 'auto';
            clonedCard.style.overflow = 'visible';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `one-piece-tier-list.png`;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      alert("Houve um problema ao processar o download. Verifique se as imagens carregaram.");
    }
  };

  const handleDragStart = (id: string) => setDraggedCharacter(id);
  
  const handleDrop = (tier: TierKey) => {
    if (!draggedCharacter) return;
    setTierList(prev => [
      ...prev.filter(i => i.characterId !== draggedCharacter), 
      { characterId: draggedCharacter, tier }
    ]);
    setDraggedCharacter(null);
  };

  const filteredCharacters = useMemo(() => {
    return CHARACTERS.filter(char => 
      !tierList.find(t => t.characterId === char.id) &&
      (char.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       char.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tierList, searchQuery]);

  const tiers: TierKey[] = ['S', 'A', 'B', 'C', 'F'];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
          <div>
            <h1 className="text-3xl font-bold italic tracking-tighter">ONE PIECE TIER MAKER</h1>
            <p className="text-slate-400 text-sm">Crie e baixe sua lista de líderes favorita</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownloadTierList} className="bg-indigo-600 hover:bg-indigo-700">
              <Download size={18} className="mr-2" /> Baixar PNG
            </Button>
            <Button variant="outline" onClick={() => setTierList([])} className="border-slate-700 text-white">
              <RotateCcw size={18} className="mr-2" /> Resetar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TIER LIST CONTAINER */}
          <div className="lg:col-span-8">
            <Card id="tier-list-card" className="bg-slate-900 border-slate-800 p-4 shadow-2xl">
              <div className="space-y-3">
                {tiers.map(tier => (
                  <div key={tier} className="flex gap-2 group">
                    <div 
                      className="w-20 h-24 md:w-24 md:h-24 flex items-center justify-center rounded-lg text-2xl font-black shadow-inner"
                      style={{ backgroundColor: TIER_COLORS[tier].bg, color: '#000' }}
                    >
                      {tierLabels[tier]}
                    </div>
                    
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(tier)}
                      className="flex-1 bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-700 p-2 min-h-[100px] flex flex-wrap gap-2 transition-colors hover:bg-slate-800/50"
                    >
                      {tierList.filter(i => i.tier === tier).map(item => {
                        const char = CHARACTERS.find(c => c.id === item.characterId);
                        return char ? (
                          <div key={char.id} className="relative w-16 h-24 md:w-20 md:h-28 bg-slate-900 rounded border border-slate-700 overflow-hidden group/item">
                            <img 
                              src={getProxiedImageUrl(char.image)} 
                              crossOrigin="anonymous" 
                              className="w-full h-full object-cover"
                              alt={char.name}
                            />
                            <button 
                              onClick={() => setTierList(prev => prev.filter(p => p.characterId !== char.id))}
                              className="absolute top-0 right-0 bg-red-600 p-1 rounded-bl opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* SELEÇÃO DE PERSONAGENS */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-slate-900 border-slate-800 p-4 sticky top-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar pelo nome ou código (OP01)..." 
                  className="w-full bg-slate-800 border-slate-700 rounded-lg py-2 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {filteredCharacters.map(char => (
                  <div 
                    key={char.id}
                    draggable
                    onDragStart={() => handleDragStart(char.id)}
                    className="aspect-[3/4] bg-slate-800 rounded border border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all hover:scale-105 overflow-hidden"
                  >
                    <img 
                      src={getProxiedImageUrl(char.image)} 
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover pointer-events-none" 
                      alt={char.name}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
