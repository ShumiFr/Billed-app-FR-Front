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

    test("HandleSubmit should call updateBill and onNavigate", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {};

      // Initialisation de localStorage avec les données nécessaires
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
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
        email: "employee@test.tld",
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

/* Le test doit simuler un utilisateur remplissant le formulaire et soumettant une nouvelle note de frais.

  Il doit également vérifier que l'API est appelée correctement, que les données sont bien transmises,
  et que le comportement en cas d'erreur est géré comme attendu
  
  1. Analyser le code existant :
    ○ sumbit du formulaire =
      → handleSubmit()
      → qui à sont tour appelle updateBill pour faire la requête POST via this.store.bills().update(...).
    
    ○ Je dois m'appuyer sur le mock de l'API pour simuler son appel.
      → Exemple : this.store.bills().update().
  
  Cas de succés (requête POST réussie) : Vérifier que l'appel à l'API est correct et que la redirection vers la page de notes de frais est effectué.
  Cas d'erreur (requête POST échouée) : Simuler une erreur et vérifier que l'erreur est gérée correctement.
  
  • Utils :
    → fireEvent pour remplir le formulaire : On simulte l'interaction utilisateur.
  
  • Aide :
    → Pour vérifier si l'API à fonctionné, il faut vérifier le statut code de la requête http
      → 200 = OK
      → 400 = Bad Request
      → 500 = Internal Server Error
    → Pour vérifier si la redirection a fonctionné, il faut vérifier si la méthode onNavigate a été appelée avec le bon argument.
    → Pour simuler une erreur, on peut utiliser le mock de l'API pour forcer une erreur.  */

describe("Given I am connected as an employee", () => {
  describe("When I submit the form", () => {
    test("Then the API call should be correct and the redirection to the expense page should be performed", async () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {};

      // Initialisation de localStorage avec les données nécessaires
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const expenseType = screen.getByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const amount = screen.getByTestId("amount");
      const datepicker = screen.getByTestId("datepicker");
      const vat = screen.getByTestId("vat");
      const pct = screen.getByTestId("pct");
      const commentary = screen.getByTestId("commentary");
      const file = screen.getByAltText("file");

      fireEvent.change(expenseType, {
        target: { value: "Restaurants et bars" },
      });
      fireEvent.change(expenseName, { target: { value: "Dinner" } });
      fireEvent.change(amount, { target: { value: "100" } });
      fireEvent.change(datepicker, { target: { value: "2023-10-10" } });
      fireEvent.change(vat, { target: { value: "20" } });
      fireEvent.change(pct, { target: { value: "10" } });
      fireEvent.change(commentary, { target: { value: "Business dinner" } });
      fireEvent.change(file, {
        target: {
          files: [
            new File(["file content"], "file.png", { type: "image/png" }),
          ],
        },
      });

      fireEvent(
        screen.getById("btn-send-bill", "Submit"),
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    test("Then the API responds with an error and displays the error message to the user", async () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const store = {};

      // Initialisation de localStorage avec les données nécessaires
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
    });
  });
});
