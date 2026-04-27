'use client';

import { useState, useMemo } from 'react';
import { calculateSubnet, isValidIp, CIDR_OPTIONS, SubnetResult, getSubnetChildren } from '@/lib/ip-utils';
import { motion } from 'motion/react';
import { ShieldAlert, Search, Hash, SplitSquareHorizontal, Calculator, Activity } from 'lucide-react';
import PacketSimulator from '@/components/packet-simulator';

// --- Components ---

function renderBinaryWithColor(binary: string, cidr: number) {
  let bitIndex = 0;
  return binary.split('').map((char, i) => {
    if (char === '.') return <span key={i} className="text-[#666] mx-[4px]">.</span>;
    const isNetwork = bitIndex < cidr;
    bitIndex++;
    return (
      <span key={i} className={isNetwork ? "text-[#00D1FF]" : "text-[#444]"}>
        {char}
      </span>
    );
  });
}

function ResultCard({ title, subtitle, value, highlight = false }: { title: string, subtitle: string, value: string, highlight?: boolean }) {
  return (
    <div className="bg-[#15151A] border border-[#2D2D33] p-5 rounded-[8px] flex flex-col">
      <div className="text-[11px] uppercase tracking-[2px] text-[#88888E] font-bold">
        {title}
      </div>
      <div className={`font-mono mt-2 flex-grow ${highlight ? 'text-[#00D1FF] text-[20px] sm:text-[24px]' : 'text-[#E0E0E6] text-[16px] sm:text-[18px]'}`}>
        {value}
      </div>
      {subtitle && <div className="text-[#88888E] text-[12px] mt-1 font-sans">{subtitle}</div>}
    </div>
  );
}

// --- VLSM Tree Node Component ---
function VLSMNode({ subnet, splits, toggleSplit, rootCidr }: { subnet: SubnetResult, splits: Record<string, boolean>, toggleSplit: (key: string) => void, rootCidr: number }) {
  const key = `${subnet.networkAddress}/${subnet.cidr}`;
  const isSplit = splits[key];
  const canSplit = subnet.cidr < 32;
  const children = isSplit ? getSubnetChildren(subnet.networkAddress, subnet.cidr) : null;

  const cidrColors = ["#00D1FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];
  const color = cidrColors[subnet.cidr % cidrColors.length];
  
  // Render binary string showing the allocated subnet bits
  const renderVLSMBinary = () => {
    let bitIndex = 0;
    return subnet.ipBinary.split('').map((char, i) => {
      if (char === '.') return <span key={i} className="text-[#444] mx-[2px]">.</span>;
      
      const currentBitIndex = bitIndex;
      bitIndex++;
      
      if (currentBitIndex < rootCidr) {
        // Original network bits
        return <span key={i} className="text-[#88888E]">{char}</span>;
      } else if (currentBitIndex >= rootCidr && currentBitIndex < subnet.cidr) {
        // Borrowed bits for this VLSM subnet
        return <span key={i} className="font-bold border-b-2" style={{ color, borderColor: color }}>{char}</span>;
      } else {
        // Host bits
        return <span key={i} className="text-[#444]">{char}</span>;
      }
    });
  };

  return (
    <li>
      <div className="inline-flex flex-col items-center group">
        <div 
          className="border border-[#3A3A42] bg-[#15151A] p-4 rounded-[8px] flex flex-col items-center min-w-[220px] overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:border-[#4A4A52]"
        >
          <div className="absolute top-0 left-0 w-full h-[4px] opacity-80" style={{ backgroundColor: color }}></div>
          
          <div className="font-mono text-[16px] font-bold text-[#E0E0E6] mt-1 tracking-[1px]">
            {subnet.networkAddress}<span style={{ color }}>/{subnet.cidr}</span>
          </div>
          
          {subnet.cidr > rootCidr && (
             <div className="text-[12px] font-mono mt-1 mb-1 tracking-[2px]">
               {renderVLSMBinary()}
             </div>
          )}
          
          <div className="text-[11px] text-[#88888E] font-mono mt-2 bg-[#0A0A0B] px-3 py-1 rounded">
            {subnet.networkAddress} <span className="text-[#444]">—</span> {subnet.broadcastAddress}
          </div>
          
          <div className="text-[12px] text-[#E0E0E6] font-bold mt-3">
            IPs usáveis: <span style={{ color }}>{subnet.numHosts.toLocaleString('pt-br')}</span>
          </div>

          {canSplit && (
            <button
              onClick={() => toggleSplit(key)}
              className="mt-4 text-[10px] uppercase tracking-[2px] font-bold bg-[#2D2D33] hover:bg-[#3A3A42] text-[#E0E0E6] px-4 py-2 rounded-[4px] cursor-pointer transition-colors w-full"
            >
              {isSplit ? 'Mesclar' : `Dividir para /${subnet.cidr + 1}`}
            </button>
          )}
        </div>
      </div>
      
      {isSplit && children && (
        <ul>
          <VLSMNode subnet={children[0]} splits={splits} toggleSplit={toggleSplit} rootCidr={rootCidr} />
          <VLSMNode subnet={children[1]} splits={splits} toggleSplit={toggleSplit} rootCidr={rootCidr} />
        </ul>
      )}
    </li>
  );
}

export default function SubnetCalculator() {
  const [ipInput, setIpInput] = useState('192.168.1.0');
  const [cidr, setCidr] = useState<number>(24);
  const [viewMode, setViewMode] = useState<'calculator' | 'vlsm' | 'simulator'>('simulator');
  
  // State for tracking which networks are split in VLSM
  const [splits, setSplits] = useState<Record<string, boolean>>({});

  const isValid = isValidIp(ipInput);
  
  const result: SubnetResult | null = useMemo(() => {
    if (!isValid) return null;
    return calculateSubnet(ipInput, cidr);
  }, [ipInput, cidr, isValid]);

  const toggleSplit = (key: string) => {
    setSplits(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] text-[#E0E0E6] font-sans selection:bg-[#00D1FF]/30 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-[#2D2D33] py-5 px-6 lg:px-10 flex justify-between items-center flex-wrap gap-4 shrink-0">
        <div>
          <span className="text-[#00D1FF] font-extrabold text-[20px]">IP</span>
          <span className="font-light text-[20px] tracking-[4px]">ARCHITECT</span>
        </div>
        <div className="text-[#88888E] font-mono text-[12px] tracking-[1px]">SUBNET CALCULATOR v2.4.0</div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[300px_1fr] bg-[#2D2D33] gap-[2px] overflow-hidden">
        
        {/* Sidebar */}
        <div className="bg-[#0F0F12] p-6 lg:p-[30px] flex flex-col gap-6 shrink-0 overflow-y-auto">
          
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row bg-[#1A1A1E] p-1 rounded-[6px] border border-[#2D2D33] gap-1">
            <button 
              onClick={() => setViewMode('calculator')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-[10px] uppercase tracking-[1px] font-bold rounded-[4px] transition-colors ${viewMode === 'calculator' ? 'bg-[#2D2D33] text-[#00D1FF]' : 'text-[#88888E] hover:text-[#E0E0E6]'}`}
            >
              <Calculator className="w-3 h-3" /> Simples
            </button>
            <button 
              onClick={() => setViewMode('vlsm')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-[10px] uppercase tracking-[1px] font-bold rounded-[4px] transition-colors ${viewMode === 'vlsm' ? 'bg-[#2D2D33] text-[#00D1FF]' : 'text-[#88888E] hover:text-[#E0E0E6]'}`}
            >
              <SplitSquareHorizontal className="w-3 h-3" /> VLSM
            </button>
            <button 
              onClick={() => setViewMode('simulator')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-[10px] uppercase tracking-[1px] font-bold rounded-[4px] transition-colors ${viewMode === 'simulator' ? 'bg-[#2D2D33] text-[#00D1FF]' : 'text-[#88888E] hover:text-[#E0E0E6]'}`}
            >
              <Activity className="w-3 h-3" /> Packet Tracer
            </button>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[11px] uppercase tracking-[2px] text-[#88888E] font-bold">{viewMode === 'vlsm' ? 'Rede Principal' : 'Endereço IP Host'}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88888E]" />
              <input 
                type="text" 
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value.trim())}
                className={`w-full bg-[#1A1A1E] border ${isValid ? 'border-[#3A3A42] focus:border-[#00D1FF]' : 'border-red-500/50 focus:border-red-500/50 focus:text-red-400'} rounded-[4px] py-3 pl-9 pr-3 text-[#FFF] font-mono text-[18px] outline-none transition-colors`}
              />
            </div>
            {!isValid && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[11px] mt-1 flex items-center gap-1 uppercase tracking-wide">
                <ShieldAlert className="w-3 h-3" /> Formato Inválido
              </motion.p>
            )}
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[11px] uppercase tracking-[2px] text-[#88888E] font-bold">Máscara de Rede (CIDR)</label>
            <div className="relative group">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88888E] group-focus-within:text-[#00D1FF] transition-colors" />
              <select
                value={cidr}
                onChange={(e) => setCidr(Number(e.target.value))}
                className="w-full bg-[#1A1A1E] border border-[#3A3A42] rounded-[4px] py-3 pl-9 pr-3 text-[#FFF] font-mono text-[16px] xl:text-[14px] 2xl:text-[16px] focus:border-[#00D1FF] outline-none transition-colors cursor-pointer appearance-none"
              >
                {CIDR_OPTIONS.map(opt => (
                  <option key={opt.cidr} value={opt.cidr}>
                    /{opt.cidr} ({opt.mask})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <div className="text-[11px] uppercase tracking-[2px] text-[#88888E] font-bold mb-[10px]">Contexto</div>
            {viewMode === 'vlsm' && (
              <p className="text-[13px] leading-[1.5] text-[#88888E]">
                A tecnologia <span className="text-[#00D1FF] font-bold">VLSM</span> permite pegar uma rede grande e dividí-la em redes menores e precisas. Clique em <strong className="text-[#E0E0E6]">Dividir</strong> para gerar sub-redes.
              </p>
            )}
            {viewMode === 'calculator' && (
               <p className="text-[13px] leading-[1.5] text-[#88888E]">
                A operação <span className="text-[#00D1FF] font-bold">AND</span> binária é aplicada entre o endereço IP e a máscara para determinar o início da rede.
              </p>
            )}
            {viewMode === 'simulator' && (
               <p className="text-[13px] leading-[1.5] text-[#88888E]">
                O processo de <span className="text-[#00D1FF] font-bold">Encaminhamento de Pacotes</span> avalia a tabela de roteamento e de vizinhança para encapsular os quadros L2 corretamente pela rede.
              </p>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#0A0A0B] p-6 lg:p-[40px] flex flex-col gap-[30px] overflow-auto relative">
          
          {viewMode === 'simulator' && (
            <div className="w-full h-full flex flex-col">
              <PacketSimulator />
            </div>
          )}

          {viewMode === 'vlsm' && result && (
            <div className="absolute inset-0 p-10 overflow-auto flex justify-center items-start">
               <div className="vlsm-tree min-w-max pb-20">
                  <ul className="!p-0 !m-0 !before:hidden">
                    <VLSMNode subnet={calculateSubnet(result.networkAddress, result.cidr)} splits={splits} toggleSplit={toggleSplit} rootCidr={result.cidr} />
                  </ul>
               </div>
            </div>
          )}

          {viewMode === 'calculator' && result && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={`${result.ip}-${result.cidr}`}
              className="flex-1 flex flex-col max-w-5xl mx-auto w-full"
            >
              <div className="flex flex-col gap-[30px] flex-1">
                {/* Results Grid */}
                <div>
                  <h2 className="text-[11px] uppercase tracking-[2px] text-[#FFF] font-bold mb-5 mt-2">Resultados do Cálculo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ResultCard title="Endereço de Rede" subtitle="Primeiro endereço (reservado)" value={result.networkAddress} highlight />
                    <ResultCard title="Endereço de Broadcast" subtitle="Último endereço (reservado)" value={result.broadcastAddress} highlight />
                    <ResultCard title="Intervalo de Hosts" subtitle="Endereços para atribuição" value={`${result.firstHost} — ${result.lastHost}`} />
                    <ResultCard title="Hosts Disponíveis" subtitle={`${result.numHosts + 2} total (rede + broadcast)`} value={`${result.numHosts.toLocaleString('pt-BR')} utilizáveis`} />
                  </div>
                </div>

                {/* Binary Block */}
                <div>
                  <h2 className="text-[11px] uppercase tracking-[2px] text-[#FFF] font-bold mb-[20px]">Visualização Didática (Binário)</h2>
                  <div className="bg-[#15151A] border border-[#2D2D33] rounded-[8px] p-5 overflow-x-auto">
                    <div className="min-w-[500px] flex flex-col font-mono text-[14px] sm:text-[16px] tracking-[1px]">
                      
                      <div className="flex justify-between items-center py-2 border-b border-[#222] h-[40px]">
                        <div className="text-[#88888E]">IP:</div>
                        <div className="text-right">{renderBinaryWithColor(result.ipBinary, result.cidr)}</div>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-[#222] h-[40px]">
                        <div className="text-[#88888E]">MASK:</div>
                        <div className="text-right">{renderBinaryWithColor(result.maskBinary, result.cidr)}</div>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b-2 border-[#00D1FF] h-[40px]">
                        <div className="text-[#FFD700] font-bold pr-[10px]">AND</div>
                        <div className="text-right">{renderBinaryWithColor(result.networkBinary, result.cidr)}</div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-[15px] min-h-[40px]">
                        <div className="text-[11px] uppercase tracking-[2px] text-[#88888E] font-bold font-sans">REDE:</div>
                        <div className="text-right text-[#00D1FF] text-[20px]">
                          {result.networkAddress.split('.').join(' . ')}
                        </div>
                      </div>
                      
                    </div>
                    
                    <div className="flex gap-5 font-sans text-[12px] mt-4">
                      <div className="flex items-center gap-[6px]">
                        <div className="w-2 h-2 rounded-[2px] bg-[#00D1FF]"></div>
                        <span className="text-[#88888E]">Bits de Rede</span>
                      </div>
                      <div className="flex items-center gap-[6px]">
                        <div className="w-2 h-2 rounded-[2px] bg-[#444]"></div>
                        <span className="text-[#88888E]">Bits de Host</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dica Didatica Section */}
                <div className="mt-auto bg-[#1A1A1E] p-[15px] rounded-[4px] border-l-4 border-[#00D1FF] mb-10">
                  <p className="text-[12px] m-0 text-[#88888E] leading-relaxed">
                    <strong className="text-[#FFF]">DICA DIDÁTICA:</strong> Para descobrir o endereço de Broadcast, pegue o endereço de rede em binário e inverta todos os bits de host (de 0 para 1). O resultado será o último endereço da sub-rede.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {!result && (
             <div className="flex-1 flex flex-col items-center justify-center text-[#88888E] opacity-50 space-y-4 py-20">
               <span className="font-mono text-4xl">_</span>
               <span className="text-sm uppercase tracking-widest font-bold">Aguardando Input Válido</span>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}