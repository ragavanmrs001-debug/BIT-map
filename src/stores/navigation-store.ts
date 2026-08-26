import { create } from 'zustand';

export interface RouteStep {
  text: string;
  instruction: string;
  point: { x: number; y: number };
  distance: number;
}

interface NavigationState {
  from: string | null;
  to: string | null;
  routeType: 'pedestrian' | 'vehicle';
  path: string[];
  nodeCoordinates: { x: number; y: number }[];
  steps: RouteStep[];
  currentStepIndex: number;
  isSimulating: boolean;
  distance: number;
  startPoint: { x: number; y: number } | null;
  endPoint: { x: number; y: number } | null;
  isActive: boolean;

  setFrom: (id: string | null) => void;
  setTo: (id: string | null) => void;
  setRouteType: (type: 'pedestrian' | 'vehicle') => void;
  setRoute: (
    path: string[],
    nodeCoordinates: { x: number; y: number }[],
    steps: RouteStep[],
    distance: number,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  toggleSimulation: () => void;
  clearRoute: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  from: null,
  to: null,
  routeType: 'pedestrian',
  path: [],
  nodeCoordinates: [],
  steps: [],
  currentStepIndex: 0,
  isSimulating: false,
  distance: 0,
  startPoint: null,
  endPoint: null,
  isActive: false,

  setFrom: (id) => set({ from: id }),
  setTo: (id) => set({ to: id }),
  setRouteType: (type) => set({ routeType: type }),

  setRoute: (path, nodeCoordinates, steps, distance, start, end) =>
    set({
      path,
      nodeCoordinates,
      steps,
      currentStepIndex: 0,
      isSimulating: false,
      distance,
      startPoint: start,
      endPoint: end,
      isActive: true,
    }),

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  setStep: (index) => set({ currentStepIndex: index }),

  toggleSimulation: () =>
    set((state) => ({ isSimulating: !state.isSimulating })),

  clearRoute: () =>
    set({
      path: [],
      nodeCoordinates: [],
      steps: [],
      currentStepIndex: 0,
      isSimulating: false,
      distance: 0,
      startPoint: null,
      endPoint: null,
      isActive: false,
      from: null,
      to: null,
    }),
}));
