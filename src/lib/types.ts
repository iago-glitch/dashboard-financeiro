export type TipoCompra = "Parcelado" | "À vista" | "Assinatura" | "Combustível";

export interface Compra {
  titular: string;
  tipoCompra: TipoCompra;
  cartao: string;
  descricao: string;
  valorParcela: number | null;
  qtdParcelas: number | null;
  mesInicio: string;
  mesFim: string;
  valorTotal: number | null;
  mesesRestantes: number | null;
  isRecorrente: boolean;
  status: string;
}

export interface ResumoMensal {
  mes: string;
  totalGeral: number;
  porTitular: Record<string, number>;
  porTipo: Record<string, number>;
  terminaTotal: number;
  terminaParcelado: number;
  terminaPorTitular: Record<string, number>;
}

export interface SheetData {
  compras: Compra[];
  resumo: ResumoMensal[];
  titulares: string[];
  cartoes: string[];
  tipos: TipoCompra[];
  fetchedAt: string;
}
