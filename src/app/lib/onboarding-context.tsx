import { createContext, useContext, useReducer, type ReactNode } from "react";
import { submitOnboarding, DEVICE_ID } from "./api";
import { setOnboardingComplete } from "./storage";

export interface OnboardingData {
  elderlyName: string;
  elderlyAge: string;
  medications: Array<{ name: string; dose: string; time: string }>;
  contacts: Array<{ name: string; relation: string; phone: string }>;
  healthConditions: string[];
  wifiSSID: string;
  wifiPassword: string;
}

const initialData: OnboardingData = {
  elderlyName: "",
  elderlyAge: "",
  medications: [],
  contacts: [],
  healthConditions: [],
  wifiSSID: "",
  wifiPassword: "",
};

type Action =
  | { type: "UPDATE"; payload: Partial<OnboardingData> }
  | { type: "ADD_MEDICATION"; payload: { name: string; dose: string; time: string } }
  | { type: "REMOVE_MEDICATION"; payload: number }
  | { type: "ADD_CONTACT"; payload: { name: string; relation: string; phone: string } }
  | { type: "REMOVE_CONTACT"; payload: number }
  | { type: "TOGGLE_CONDITION"; payload: string };

function reducer(state: OnboardingData, action: Action): OnboardingData {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.payload };
    case "ADD_MEDICATION":
      return { ...state, medications: [...state.medications, action.payload] };
    case "REMOVE_MEDICATION":
      return {
        ...state,
        medications: state.medications.filter((_, i) => i !== action.payload),
      };
    case "ADD_CONTACT":
      return { ...state, contacts: [...state.contacts, action.payload] };
    case "REMOVE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((_, i) => i !== action.payload),
      };
    case "TOGGLE_CONDITION": {
      const exists = state.healthConditions.includes(action.payload);
      return {
        ...state,
        healthConditions: exists
          ? state.healthConditions.filter((c) => c !== action.payload)
          : [...state.healthConditions, action.payload],
      };
    }
    default:
      return state;
  }
}

interface OnboardingContextValue {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
  addMedication: (med: { name: string; dose: string; time: string }) => void;
  removeMedication: (index: number) => void;
  addContact: (contact: { name: string; relation: string; phone: string }) => void;
  removeContact: (index: number) => void;
  toggleCondition: (condition: string) => void;
  submit: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, initialData);

  const value: OnboardingContextValue = {
    data,
    updateData: (partial) => dispatch({ type: "UPDATE", payload: partial }),
    addMedication: (med) => dispatch({ type: "ADD_MEDICATION", payload: med }),
    removeMedication: (i) => dispatch({ type: "REMOVE_MEDICATION", payload: i }),
    addContact: (contact) => dispatch({ type: "ADD_CONTACT", payload: contact }),
    removeContact: (i) => dispatch({ type: "REMOVE_CONTACT", payload: i }),
    toggleCondition: (c) => dispatch({ type: "TOGGLE_CONDITION", payload: c }),
    submit: async () => {
      await submitOnboarding({
        name: data.elderlyName,
        age: data.elderlyAge ? parseInt(data.elderlyAge, 10) : undefined,
        medications: data.medications,
        family_contacts: data.contacts.map((c) => ({
          ...c,
          telegram_id: "",
        })),
        health_conditions: data.healthConditions,
      });
      await setOnboardingComplete();
    },
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
