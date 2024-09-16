/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true); // Vérifier que la classe "active-icon" a été ajoutée
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("When I click on the newBill button, then I should be redirected to the new bill page", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = jest.fn();
      const store = {};
      const localStorage = window.localStorage;

      // Instancier la classe avec les paramètres nécessaires
      new Bills({ document, onNavigate, store, localStorage });

      const newBillButton = screen.getByTestId("btn-new-bill");
      newBillButton.click();

      // Vérifier que la fonction de navigation a été appelée avec le bon argument
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("When I click on an iconEye, then the bill image should be displayed in a modal", () => {
      // Simuler la méthode jQuery modal
      $.fn.modal = jest.fn();

      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = jest.fn();
      const store = {};
      const localStorage = window.localStorage;

      // Instancier la classe avec les paramètres nécessaires
      new Bills({ document, onNavigate, store, localStorage });

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      expect(iconEye).not.toBeNull();
      iconEye.click();

      const modalBody = document.querySelector("#modaleFile .modal-body");
      expect(modalBody.innerHTML).toContain("<img width=");

      const modal = document.getElementById("modaleFile");

      // Vérifier que la fonction modal a été appelée
      expect($.fn.modal).toHaveBeenCalledWith("show");

      // Vérifier les classes "modal" et "fade" ajoutées à l'élément
      expect(modal.classList).toContain("modal");
      expect(modal.classList).toContain("fade");
    });
  });

  describe("Then formatDate and formatStatus should return the correct format", () => {
    test("Then formatDate should return a date with the format dd MMM. yyyy", () => {
      const date = "2022-12-31";
      expect(formatDate(date)).toBe("31 Déc. 22");
    });

    test("Then formatStatus should return 'Pending' if status is 'pending'", () => {
      expect(formatStatus("pending")).toBe("En attente");
    });
  });

  describe("When I am on Bills Page and getBills is called", () => {
    test("Then it should return formatted bills if store is present", async () => {
      // Mock des données de factures
      const mockBills = [
        { date: "2022-12-31", status: "pending" },
        { date: "2022-11-30", status: "accepted" },
      ];

      // Mock de la méthode list de la classe Store
      const mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn().mockResolvedValue(mockBills),
        })),
      };

      // Spy sur la méthode bills() du store
      const billsSpy = jest.spyOn(mockStore, "bills");

      // Instancier la classe Bills avec le store mocké
      const billsInstance = new Bills({ store: mockStore, document });

      // Appeler la méthode getBills
      const bills = await billsInstance.getBills();

      // Vérifier que la méthode bills a été appelée
      expect(billsSpy).toHaveBeenCalled();

      // Vérifier que les factures retournées sont correctement formatées
      expect(bills).toEqual([
        { date: "31 Déc. 22", status: "En attente" },
        { date: "30 Nov. 22", status: "Accepté" },
      ]);
    });

    test("Then it should log an error and return unformatted date if formatDate fails", async () => {
      // Mock des données de factures corrompues
      const corruptedBills = [{ date: "invalid-date", status: "pending" }];

      // Mock de la méthode list de la classe Store
      const mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn().mockResolvedValue(corruptedBills),
        })),
      };

      // Espionner la méthode console.log
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Instancier la classe Bills avec le store mocké
      const billsInstance = new Bills({ store: mockStore, document });

      // Appeler la méthode getBills
      const bills = await billsInstance.getBills();

      // Vérifier que l'erreur a été loguée
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(Error),
        "for",
        corruptedBills[0]
      );

      // Vérifier que la date n'a pas été formatée
      expect(bills[0].date).toBe("invalid-date");

      // Nettoyer le spy
      consoleSpy.mockRestore();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      // Mock de la méthode list pour renvoyer une erreur 404
      const mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn().mockRejectedValue(new Error("Erreur 404")),
        })),
      };

      // Instancier la classe Bills avec le store mocké
      const billsInstance = new Bills({ store: mockStore, document });

      // Appeler la méthode getBills et vérifier la gestion de l'erreur
      try {
        await billsInstance.getBills();
      } catch (error) {
        expect(error.message).toBe("Erreur 404");
      }

      // Vérifier que l'erreur 404 est affichée à l'écran
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches bills from an API and fails with 500 message error", async () => {
      // Mock de la méthode list pour renvoyer une erreur 500
      const mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn().mockRejectedValue(new Error("Erreur 500")),
        })),
      };

      // Instancier la classe Bills avec le store mocké
      const billsInstance = new Bills({ store: mockStore, document });

      // Appeler la méthode getBills et vérifier la gestion de l'erreur
      try {
        await billsInstance.getBills();
      } catch (error) {
        expect(error.message).toBe("Erreur 500");
      }

      // Vérifier que l'erreur 500 est affichée à l'écran
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
