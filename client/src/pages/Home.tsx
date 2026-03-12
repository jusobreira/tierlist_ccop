import { useState, useMemo, useEffect, useRef } from 'react';
import { CHARACTERS, TIER_COLORS, TierKey } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'; // Usando seu componente enviado
import { X, Download, RotateCcw, Search } from 'lucide-react';
import html2canvas from 'html2canvas';

// FUNÇÃO CHAVE: Ignora o bloqueio de CORS usando um proxy de imagens gratuito
const getProxiedImageUrl = (url: string) => {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp`;
};

export default function Home() {
  const [tierList, setTierList] = useState<{characterId: string, tier: TierKey}[]>([]);
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierLabels, setTierLabels] = useState<Record<string, string>>({
    S: 'S', A: 'A', B: 'B', C: 'C', F: 'F'
  });
  const [editingTier, setEditingTier] = useState<TierKey | null>(null);
  const [tierListWidth, setTierListWidth] = useState(65);
  const [isResizing, setIsResizing] = useState(false);
  
  // Referências para o grid responsivo
  const [tierColumnsCount, setTierColumnsCount] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lógica de download aprimorada
  const handleDownloadTierList = async () => {
    const element = document.getElementById('tier-list-card');
    if (!element) return;

    try {
      // 1. Criamos um clone temporário para não zoar a UI do usuário durante o print
      const canvas = await html2canvas(element, {
        useCORS: true,           // Habilita Cross-Origin
        allowTaint: false,        // Impede que o canvas seja "sujado"
        backgroundColor: '#0f172a', // Cor de fundo slate-900
        scale: 2,                 // Dobra a resolução para ficar nítido
        logging: false,
        onclone: (clonedDoc) => {
          // Ajuste fino no clone: remove scrolls e garante que tudo apareça
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
      link.download = `one-piece-tier-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Falha no download:", err);
      alert("Erro ao gerar imagem. Verifique sua conexão.");
    }
  };

  // ... (Suas outras funções de drag and drop permanecem iguais)
  const handleDragStart = (id: string) => setDraggedCharacter(id);
  const handleDrop = (tier: TierKey) => {
    if (!draggedCharacter) return;
    setTierList(prev => [...prev.filter(i => i.characterId !== draggedCharacter), { characterId: draggedCharacter, tier }]);
    setDraggedCharacter(null);
  };

  const filteredCharacters = useMemo(() => {
    return CHARACTERS.filter(char => 
      !tierList.find(t => t.characterId === char.id) &&
      (char.name.toLowerCase().includes(searchQuery.toLowerCase()) || char.code.includes(searchQuery))
    );
  }, [tierList, searchQuery]);

  const tiers: TierKey[] = ['S', 'A', 'B', 'C', 'F'];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-8 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-bold italic tracking-tighter">ONE PIECE TIER MAKER</h1>
            <p className="text-slate-400 text-sm">Organize seus líderes favoritos</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownloadTierList} className="bg-indigo-600 hover:bg-indigo-700">
              <Download size={18} className="mr-2" /> Baixar PNG
            </Button>
            <Button variant="outline" onClick={() => setTierList([])} className="border-slate-700">
              <RotateCcw size={18} className="mr-2" /> Resetar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ÁREA DA TIER LIST */}
          <div className="lg:col-span-8">
            <Card id="tier-list-card" className="bg-slate-900 border-slate-800 p-4 shadow-2xl">
              <div className="space-y-3">
                {tiers.map(tier => (
                  <div key={tier} className="flex gap-2 group">
                    <div 
                      className="w-24 h-24 flex items-center justify-center rounded-lg text-2xl font-black shadow-inner"
                      style={{ backgroundColor: TIER_COLORS[tier].bg, color: '#000' }}
                    >
                      {tierLabels[tier]}
                    </div>
                    
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(tier)}
                      className="flex-1 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700 p-2 min-h-[100px] flex flex-wrap gap-2"
                    >
                      {tierList.filter(i => i.tier === tier).map(item => {
                        const char = CHARACTERS.find(c => c.id === item.characterId);
                        return char ? (
                          <div key={char.id} className="relative w-20 h-28 bg-slate-900 rounded border border-slate-700 overflow-hidden">
                            <img 
                              src={getProxiedImageUrl(char.image)} 
                              crossOrigin="anonymous" 
                              className="w-full h-full object-cover"
                              alt={char.name}
                            />
                            <button 
                              onClick={() => setTierList(prev => prev.filter(p => p.characterId !== char.id))}
                              className="absolute top-0 right-0 bg-red-600 p-0.5 rounded-bl"
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

          {/* ÁREA DE SELEÇÃO */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-slate-900 border-slate-800 p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar líder..." 
                  className="w-full bg-slate-800 border-slate-700 rounded-lg py-2 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCharacters.map(char => (
                  <div 
                    key={char.id}
                    draggable
                    onDragStart={() => handleDragStart(char.id)}
                    className="aspect-[3/4] bg-slate-800 rounded border border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-colors overflow-hidden"
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
