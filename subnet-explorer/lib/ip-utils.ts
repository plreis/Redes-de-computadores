export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function intToBinary(int: number): string {
  return [
    ((int >>> 24) & 255).toString(2).padStart(8, '0'),
    ((int >>> 16) & 255).toString(2).padStart(8, '0'),
    ((int >>> 8) & 255).toString(2).padStart(8, '0'),
    (int & 255).toString(2).padStart(8, '0')
  ].join('.');
}

export function cidrToInt(cidr: number): number {
  return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}

export function isValidIp(str: string): boolean {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(str);
}

export interface SubnetResult {
  ip: string;
  cidr: number;
  ipBinary: string;
  maskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  numHosts: number;
}

export function calculateSubnet(ip: string, cidr: number): SubnetResult {
  const ipInt = ipToInt(ip);
  const maskInt = cidrToInt(cidr);
  
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  
  const firstHostInt = cidr >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHostInt = cidr >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;
  
  let numHosts = 0;
  if (cidr === 32) numHosts = 1;
  else if (cidr === 31) numHosts = 2; // RFC 3021 /31 have 2 point-to-point links
  else numHosts = Math.pow(2, 32 - cidr) - 2;

  return {
    ip,
    cidr,
    ipBinary: intToBinary(ipInt),
    maskBinary: intToBinary(maskInt),
    networkBinary: intToBinary(networkInt),
    broadcastBinary: intToBinary(broadcastInt),
    subnetMask: intToIp(maskInt),
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    numHosts
  };
}

export function getSubnetChildren(ip: string, cidr: number): [SubnetResult, SubnetResult] | null {
  if (cidr >= 32) return null;
  const parentBlock = calculateSubnet(ip, cidr);

  const nextCidr = cidr + 1;
  const child1IpInt = ipToInt(parentBlock.networkAddress);
  const child2IpInt = (child1IpInt + Math.pow(2, 32 - nextCidr)) >>> 0;

  return [
    calculateSubnet(intToIp(child1IpInt), nextCidr),
    calculateSubnet(intToIp(child2IpInt), nextCidr)
  ];
}

export const CIDR_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const mask = cidrToInt(i);
  return {
    cidr: i,
    mask: intToIp(mask)
  };
}).reverse();
