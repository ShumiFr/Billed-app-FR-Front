/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

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
        JSON.stringify({ email: "employee@test.com" })
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
        JSON.stringify({ email: "employee@test.com" })
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

    test("HandleSubmit should call updateBill and onNavigate", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {};

      // Initialisation de localStorage avec les données nécessaires
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.com" })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Mock de updateBill pour vérifier qu'il est appelé correctement
      const updateBillSpy = jest
        .spyOn(newBill, "updateBill")
        .mockImplementation(() => {});

      // Je récupère le formulaire
      const form = document.querySelector(`form[data-testid="form-new-bill"]`);
      expect(form).not.toBeNull(); // Vérifie que l'élément existe

      // Je définis les valeurs des champs du formulaire
      form.querySelector(`select[data-testid="expense-type"]`).value =
        "Transports";
      form.querySelector(`input[data-testid="expense-name"]`).value =
        "Train ticket";
      form.querySelector(`input[data-testid="amount"]`).value = "100";
      form.querySelector(`input[data-testid="datepicker"]`).value =
        "2023-10-10";
      form.querySelector(`input[data-testid="vat"]`).value = "20";
      form.querySelector(`input[data-testid="pct"]`).value = "10";
      form.querySelector(`textarea[data-testid="commentary"]`).value =
        "Business trip";
      newBill.fileUrl = "https://example.com/file.png";
      newBill.fileName = "file.png";

      // Simule l'événement de soumission
      const submitEvent = {
        preventDefault: jest.fn(),
        target: form,
      };

      newBill.handleSubmit(submitEvent);

      // Vérifie que preventDefault a été appelé
      expect(submitEvent.preventDefault).toHaveBeenCalled();

      // Vérifie que updateBill a été appelé avec les bons arguments
      expect(updateBillSpy).toHaveBeenCalledWith({
        email: "employee@test.com",
        type: "Transports",
        name: "Train ticket",
        amount: 100,
        date: "2023-10-10",
        vat: "20",
        pct: 10,
        commentary: "Business trip",
        fileUrl: "https://example.com/file.png",
        fileName: "file.png",
        status: "pending",
      });

      // Vérifie que onNavigate a été appelé avec le bon argument
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);

      // Nettoyage
      updateBillSpy.mockRestore();
    });
  });
});

/* Test d'intégration POST */
