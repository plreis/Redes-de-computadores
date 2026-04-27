'use client';

import { useState, useMemo } from 'react';
import { calculateSubnet, isValidIp } from '@/lib/ip-utils';
import { Activity, ArrowRight, Route, Server, Cpu, Navigation, FileSearch, Hash } from 'lucide-react';
import { motion } from 'motion/react';

export default function PacketSimulator() {
  const [srcIp, setSrcIp] = useState('172.16.10.120');
  const [srcCidr, setSrcCidr] = useState<number>(24);
  const [srcMac, setSrcMac] = useState('00:0A:95:9D:68:16');
  
  const [gwIp, setGwIp] = useState('172.16.10.1');
  const [gwMac, setGwMac] = useState('00:1B:2C:3D:4E:5F');

  const [dstIp, setDstIp] = useState('172.16.2.3');
  const [dstMac, setDstMac] = useState('AA:BB:CC:DD:EE:FF');

  const setExemplo1 = () => {
    setSrcIp('172.16.10.120'); setSrcCidr(24);
    setDstIp('172.16.10.2');
    setGwIp('172.16.10.1');
  };

  const setExemplo2 = () => {
    setSrcIp('172.16.10.120'); setSrcCidr(24);
    setDstIp('172.16.2.3');
    setGwIp('172.16.10.1');
  };

  const isFormValid = isValidIp(srcIp) && isValidIp(dstIp) && isValidIp(gwIp);

  const simulation = useMemo(() => {
    if (!isFormValid) return null;

    const srcBlock = calculateSubnet(srcIp, srcCidr);
    const dstComputedBlock = calculateSubnet(dstIp, srcCidr); 
    
    // Step 1: Encaminhamento / Rota
    const isLocal = srcBlock.networkAddress === dstComputedBlock.networkAddress;

    let targetIp = dstIp;
    let targetMac = dstMac;
    let targetName = 'Host Destino (PC/Server)';

    if (!isLocal) {
       targetIp = gwIp;
       targetMac = gwMac;
       targetName = 'Gateway (Roteador)';
    }

    return {
      isLocal,
      networkMatched: srcBlock.networkAddress,
      targetIp,
      targetMac,
      targetName,
    };
  }, [srcIp, srcCidr, dstIp, gwIp, dstMac, gwMac, isFormValid]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Header Info */}
      <div className="bg-[#15151A] border border-[#2D2D33] p-6 rounded-[8px] shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-[#FFD700]" />
          <h2 className="text-[14px] uppercase tracking-[2px] text-[#FFF] font-bold">Simulador Packet Tracer: IP / ARP / ICMP</h2>
        </div>
        <p className="text-[13px] text-[#88888E] mb-6 leading-relaxed">
          Este módulo simula passo a passo o <strong className="text-[#00D1FF]">Processo de Encaminhamento de um Pacote IP</strong>. 
          Use os atalhos abaixo para preencher os cenários do seu laboratório para análise de mudança de MACs, frames ARP e ICMP Echo Request/Reply.
        </p>

        <div className="flex gap-4 mb-6">
          <button onClick={setExemplo1} className="bg-[#2D2D33] hover:bg-[#3A3A42] text-[#E0E0E6] text-[11px] uppercase tracking-[1px] font-bold py-2 px-4 rounded-[4px] transition-colors border-l-2 border-[#00D1FF]">
            Topo 1: Ping Mesma Rede (Local)
          </button>
          <button onClick={setExemplo2} className="bg-[#2D2D33] hover:bg-[#3A3A42] text-[#E0E0E6] text-[11px] uppercase tracking-[1px] font-bold py-2 px-4 rounded-[4px] transition-colors border-l-2 border-[#FFD700]">
            Topo 2: Ping Outra Rede (Gateway)
          </button>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[#2D2D33]">
          
          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-[#00D1FF] uppercase tracking-[1px] flex items-center gap-2"><Cpu className="w-3 h-3"/> Origem (Ex: PC-B-1)</h3>
            <input value={srcIp} onChange={e => setSrcIp(e.target.value)} placeholder="IP Origem" className="bg-[#1A1A1E] border border-[#3A3A42] text-[#FFF] font-mono text-[14px] p-2 rounded-[4px]" />
            <div className="flex items-center gap-2">
              <span className="text-[#88888E] font-mono">CIDR:</span>
              <input type="number" value={srcCidr} onChange={e => setSrcCidr(Number(e.target.value))} className="bg-[#1A1A1E] border border-[#3A3A42] text-[#FFF] font-mono text-[14px] p-2 rounded-[4px] w-full" />
            </div>
            <input value={srcMac} onChange={e => setSrcMac(e.target.value)} placeholder="MAC Origem" className="bg-[#1A1A1E] border border-[#3A3A42] text-[#88888E] font-mono text-[12px] p-2 rounded-[4px]" />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-[#FFD700] uppercase tracking-[1px] flex items-center gap-2"><Route className="w-3 h-3"/> Gateway Local</h3>
            <input value={gwIp} onChange={e => setGwIp(e.target.value)} placeholder="IP Gateway" className="bg-[#1A1A1E] border border-[#3A3A42] text-[#FFF] font-mono text-[14px] p-2 rounded-[4px]" />
            <input value={gwMac} onChange={e => setGwMac(e.target.value)} placeholder="MAC Gateway" className="bg-[#1A1A1E] border border-[#3A3A42] text-[#88888E] font-mono text-[12px] p-2 rounded-[4px] mt-auto" />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-[#10B981] uppercase tracking-[1px] flex items-center gap-2"><Server className="w-3 h-3"/> Destino Final</h3>
            <input value={dstIp} onChange={e => setDstIp(e.target.value)} placeholder="IP Destino Final" className="bg-[#1A1A1E] border border-[#3A3A42] text-[#FFF] font-mono text-[14px] p-2 rounded-[4px]" />
            <input value={dstMac} onChange={e => setDstMac(e.target.value)} placeholder="MAC Destino Final" className="bg-[#1A1A1E] border border-[#3A3A42] text-[#88888E] font-mono text-[12px] p-2 rounded-[4px] mt-auto" />
          </div>

        </div>
      </div>

      {/* Simulation Timeline */}
      {simulation ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 relative">
          
          <div className="absolute left-[24px] top-4 bottom-4 w-px bg-[#2D2D33] z-0"></div>

          {/* STEP 1: Roteamento */}
          <StepBox 
            icon={<Hash />}
            title="1. Localizar Rota (Isolamento de Rede)" 
            color="#00D1FF"
            description={`O Host analisa se o Destino e ele pertencem à mesma rede local. Ele aplica a máscara /${srcCidr} (AND bit-a-bit) no próprio IP e no IP Destino.`}
          >
            <div className="bg-[#0A0A0B] p-4 rounded-[4px] border border-[#2D2D33] font-mono text-[13px] text-[#E0E0E6]">
              <div className="text-[#88888E]">Resultado do Cálculo:</div>
              <div className="mt-2 text-[#FFF]">IP Origem está na rede: <span className="text-[#00D1FF]">{simulation.networkMatched}</span></div>
              <div className="mb-2 text-[#FFF]">IP Destino aponta p/ rede: <span className="text-[#00D1FF]">{calculateSubnet(dstIp, srcCidr).networkAddress}</span></div>
              
              {simulation.isLocal ? (
                <div className="text-[#10B981] font-bold mt-3 border-t border-[#222] pt-3">➔ VEREDITO: Destino na MESMA REDE LOCAL (Rota Diretamente Conectada). O pacote será enviado diretamente.</div>
              ) : (
                <div className="text-[#FFD700] font-bold mt-3 border-t border-[#222] pt-3">➔ VEREDITO: Destino em REDE REMOTA. É necessário enviar o pacote para o ROTEADOR (Gateway).</div>
              )}
            </div>
          </StepBox>

          {/* STEP 2: ARP */}
          <StepBox 
            icon={<FileSearch />}
            title="2. Resolução ARP / Neighbor (Camada 2)" 
            color="#FFD700"
            description={`O Host precisa descobrir o ENDEREÇO MAC de quem vai receber o pacote no link local. Target IP para o ARP: ${simulation.targetIp} (${simulation.targetName}).`}
          >
            <div className="bg-[#0A0A0B] p-4 rounded-[4px] border border-[#2D2D33] text-[13px]">
              <div className="font-sans text-[#88888E] mb-3">Como a Tabela ARP está vazia inicialmente, o host irá dar um &quot;Broadcast&quot; perguntando quem é o dono do IP.</div>
              <div className="flex flex-col gap-2 font-mono">
                {/* ARP Request Frame */}
                <div className="border border-[#4A4A52] bg-[#1A1A1E] p-3 rounded-[4px]">
                  <div className="text-[#FFD700] mb-2 font-bold text-[11px] uppercase tracking-[1px]">PDU 1: ARP Request (Broadcast)</div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div><span className="text-[#88888E]">MAC Source:</span> {srcMac}</div>
                    <div><span className="text-[#88888E]">MAC Dest:</span> <span className="text-[#EF4444]">FF:FF:FF:FF:FF:FF</span></div>
                    <div className="col-span-2 text-[#E0E0E6] mt-1">Dados: <span className="text-[#10B981]">&quot;Who has {simulation.targetIp}? Tell {srcIp}&quot;</span></div>
                  </div>
                </div>
                
                {/* ARP Reply Frame */}
                <div className="border border-[#4A4A52] bg-[#1A1A1E] p-3 rounded-[4px]">
                  <div className="text-[#FFD700] mb-2 font-bold text-[11px] uppercase tracking-[1px]">PDU 2: ARP Reply (Unicast)</div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div><span className="text-[#88888E]">MAC Source:</span> {simulation.targetMac}</div>
                    <div><span className="text-[#88888E]">MAC Dest:</span> {srcMac}</div>
                    <div className="col-span-2 text-[#E0E0E6] mt-1">Dados: <span className="text-[#10B981]">&quot;{simulation.targetIp} is at {simulation.targetMac}&quot;</span></div>
                  </div>
                </div>
              </div>
            </div>
          </StepBox>

          {/* STEP 3: ICMP Encapsulation */}
          <StepBox 
            icon={<Navigation />}
            title="3. Envio do Frame: ICMP / IP (Ping)" 
            color="#10B981"
            description="Com os MACs descobertos, o Host encapsula o pacote ICMP e envia pela rede."
          >
            <div className="bg-[#0A0A0B] p-4 rounded-[4px] border border-[#2D2D33]">
              <div className="border border-[#10B981]/50 bg-[#10B981]/10 p-3 rounded-[4px] font-mono text-[12px] flex flex-col gap-3">
                <div className="text-[#10B981] font-bold text-[11px] uppercase tracking-[1px] mb-1">PDU 3: ICMP Echo Request</div>
                
                <div className="flex flex-col lg:flex-row gap-4 border-b border-[#2D2D33] pb-3">
                  <div className="flex-1">
                     <span className="text-[#88888E] block mb-1">Ethernet II Header (Camada 2)</span>
                     <div><span className="text-[#88888E]">MAC Origem:</span> {srcMac}</div>
                     <div><span className="text-[#88888E]">MAC Destino:</span> <span className="text-[#00D1FF] bg-[#00D1FF]/10 px-1">{simulation.targetMac}</span></div>
                  </div>
                  <div className="flex-1 border-l border-[#2D2D33] pl-4">
                     <span className="text-[#88888E] block mb-1">IPv4 Header (Camada 3)</span>
                     <div><span className="text-[#88888E]">IP Source:</span> {srcIp}</div>
                     <div><span className="text-[#88888E]">IP Destino:</span> <span className="text-[#EF4444] bg-[#EF4444]/10 px-1">{dstIp}</span></div>
                  </div>
                </div>

                <div className="text-[#E0E0E6] bg-[#1A1A1E] p-2 rounded text-center">Payload: ICMP Message Type 8 (Ping Request)</div>
              </div>
              
              <div className="mt-4 bg-[#1A1A1E] p-4 rounded-[4px] border-l-4 border-[#00D1FF]">
                 <strong className="text-[#FFF] text-[12px] block mb-2">ANÁLISE PARA O PROFESSOR:</strong>
                 <ul className="text-[12px] text-[#88888E] space-y-2 list-disc pl-4">
                   <li><strong>Frames ARP encontrados?</strong> Sim, um Broadcast solicitando MAC do target, seguido de um Unicast respondendo.</li>
                   <li><strong>Frames com IP e ICMP?</strong> Sim, imediatamente após o ARP Reply, o Echo Request viaja envelopado em IPv4/Ethernet.</li>
                   {!simulation.isLocal && (
                     <li className="text-[#FFD700] font-bold mt-2">
                       Atenção à Mudança de MACs nos Roteadores:
                       <br/>
                       <span className="font-medium text-[#E0E0E6]">Durante a viagem de PC para PC em redes diferentes, o MAC_Destino muda em CADA SALTO (de Host-&gt;Roteador1, Roteador1-&gt;Roteador2, etc), enquanto o IP Source e IP Dest permanecem OS MESMOS de ponta a ponta.</span>
                     </li>
                   )}
                 </ul>
              </div>
            </div>
          </StepBox>

        </motion.div>
      ) : (
        <div className="text-center p-10 opacity-50 font-mono text-[#88888E]">Preencha IP Source e IP Destino de forma válida.</div>
      )}
    </div>
  );
}

function StepBox({ title, description, color, children, icon }: { title: string, description: string, color: string, children: React.ReactNode, icon: React.ReactNode }) {
  return (
    <div className="relative z-10 flex gap-4 xl:gap-6 items-start">
      <div 
        className="w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 border-4 border-[#0A0A0B] mt-[-4px]"
        style={{ backgroundColor: color, color: '#0A0A0B' }}
      >
        {icon}
      </div>
      <div className="flex-1 bg-[#15151A] border border-[#2D2D33] rounded-[8px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }}></div>
        <h3 className="text-[15px] font-bold mb-2 uppercase tracking-[1px] text-[#FFF]">{title}</h3>
        <p className="text-[13px] text-[#88888E] mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
}
