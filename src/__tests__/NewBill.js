/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import storeMock from "../__mocks__/store.js";

jest.mock("../app/store", () => {
  return {
    bills: jest.fn(() => ({
      create: jest.fn(),
      update: jest.fn(),
    })),
  };
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the NewBill constructor should initialize correctly", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {};
      const localStorage = window.localStorage;

      // Instancier la classe avec les paramètres nécessaires
      new NewBill({ document, onNavigate, store, localStorage });

      const formNewBill = document.querySelector(
        `form[data-testid="form-new-bill"]`
      );
      expect(formNewBill).toBeTruthy();
    });

    test("Then handleChangeFile should validate file extension and update file properties", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {};

      // Initialisation de localStorage avec les données nécessaires
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      // Je récupère le champs input
      const input = document.querySelector(`input[data-testid="file"]`);
      expect(input).not.toBeNull(); // Vérifie que l'élément existe

      // Je me construit un fichier avec une extension invalide qui provoquera l'erreur
      const invalidFile = new File(["file content"], "file.txt", {
        type: "text/plain",
      });

      // Je définis mon event de change
      const changeEvent = {
        preventDefault: jest.fn(),
        target: {
          files: [invalidFile],
          value: "C:\\fakepath\\file.txt",
        },
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Mock de window.alert pour éviter les erreurs
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      newBill.handleChangeFile(changeEvent);

      // Je vérifie que ça déclenche une alerte avec le bon contenu.
      expect(alertSpy).toHaveBeenCalledWith(
        "Seuls les fichiers avec les extensions jpg, jpeg ou png sont acceptés."
      );

      // Nettoyage
      alertSpy.mockRestore();
    });

    test("Then handleChangeFile should update fileName and fileUrl with a valid file", async () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "https://example.com/file.png",
            key: "12345",
          }),
        })),
      };

      // Initialisation de localStorage avec les données nécessaires
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      // Je récupère le champs input
      const input = document.querySelector(`input[data-testid="file"]`);
      expect(input).not.toBeNull(); // Vérifie que l'élément existe

      // Je me construit un fichier avec une extension valide
      const validFile = new File(["file content"], "file.png", {
        type: "image/png",
      });

      // Je définis mon event de change
      const changeEvent = {
        preventDefault: jest.fn(),
        target: {
          files: [validFile],
          value: "C:\\fakepath\\file.png",
        },
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Mock de window.alert pour éviter les erreurs
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      await newBill.handleChangeFile(changeEvent);

      // Vérifie que les propriétés sont mises à jour correctement
      expect(newBill.fileName).toEqual("file.png");
      expect(newBill.fileUrl).toEqual("https://example.com/file.png");

      // Nettoyage
      alertSpy.mockRestore();
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I submit the form", () => {
    test("Then the handleSubmit should redirect to the bills list page", async () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = storeMock;

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          email: "u@u",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");

      screen.getByTestId("expense-type").value = "Restaurants et bars";
      screen.getByTestId("expense-name").value = "Dinner";
      screen.getByTestId("datepicker").value = "2023-10-10";
      screen.getByTestId("amount").value = 100;
      screen.getByTestId("vat").value = 20;
      screen.getByTestId("pct").value = 10;
      screen.getByTestId("commentary").value = "Business dinner";

      const validFile = new File(["file content"], "file.png", {
        type: "image/png",
      });

      const changeEvent = {
        preventDefault: jest.fn(),
        target: {
          files: [validFile],
          value: "C:\\fakepath\\file.png",
        },
      };

      newBill.handleChangeFile(changeEvent);

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});
