declare module 'node-nmap' {
  export class NmapScan {
    constructor(hosts: string | string[], flags?: string, callback?: (error: any, report: any) => void);
    startScan(): void;
    cancelScan(): void;
    on(event: string, callback: Function): void;
  }

  export class QuickScan extends NmapScan {}
  export class OsAndPortScan extends NmapScan {}
  
  const nmap: {
    nmapLocation: string;
    NmapScan: typeof NmapScan;
    QuickScan: typeof QuickScan;
    OsAndPortScan: typeof OsAndPortScan;
  };

  export default nmap;
}