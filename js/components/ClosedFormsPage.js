  "use strict";
  /* global ClosedFormsTable ClosedFormsInputs HTML FormFilters Utility */
  /* exported ClosedFormsPage */
  function ClosedFormsPage({
    closedForms,
    closedFormsQuery,
    closedFormsSort,
    closedFormsSortAscending,
    setClosedFormsQuery,
    setClosedFormsSort,
    showFormPage,
    status,
  }) {
    const { createElement, getRadioValue, page, update } = HTML;
    const {
      applyTo,
      compareDateStrings,
      compareKey,
      compareStrings,
      identity,
      reverse,
      sort,
    } = Utility;
    const checkboxKeys = [
      "isBooked",
      "isNotBooked",
      "isTape",
      "byMissingItem",
      "byLateStudents",
      "byNoShow",
      "byStudentLeft",
      "byHasNotes",
      "byHasManual",
    ];
    let filteredForms = filter(closedForms, closedFormsQuery);
    const queryCount = createElement("span", { class: "querycount" });

    const closedFormsContainer = createElement("div", {
      child: ClosedFormsTable({
        forms: filteredForms,
        showFormPage,
        onSort,
      }),
    });

    return page({
      name: "archive",
      children: [
        createElement("h2", { textContent: "Closed Forms" }),
        createElement("div", {
          class: "closedFormsStatus",
          child: status,
        }),
        ClosedFormsInputs({ closedFormsQuery, onSubmit }),
        closedFormsContainer,
      ],
    });

    function onSort(name) {
      if (closedFormsSort !== name) closedFormsSort = name;
      else closedFormsSortAscending = !closedFormsSortAscending;
      setClosedFormsSort(closedFormsSort, closedFormsSortAscending);
      filteredForms = applyTo(
        sort(
          filteredForms,
          compareKey(closedFormsSort, getSortingFn(closedFormsSort))
        )
      )(closedFormsSortAscending ? identity : reverse);
      update(
        closedFormsContainer,
        ClosedFormsTable({ forms: filteredForms, onSort, showFormPage })
      );
    }

    // returns same object as closedFormsQuery
    function getClosedFormsQuery(form) {
      return {
        ...["start", "end", "location", "students", "items"].reduce(
          (keys, k) => ({ ...keys, [k]: form[k].value }),
          {}
        ),
        matchItems: getRadioValue(form),
        ...checkboxKeys.reduce(
          (keys, k) => ({ ...keys, [k]: form[k].checked }),
          {}
        ),
      };
    }

    function getSortingFn(name) {
      return {
        startTime: compareDateStrings,
        endTime: compareDateStrings,
        location: compareStrings,
        students: (a, b) =>
          compareStrings(
            a.reduce((names, { name }) => names + name, ""),
            b.reduce((names, { name }) => names + name, "")
          ),
        items: (a, b) =>
          compareStrings(
            a.id || a.barcode || a.description,
            b.id || b.barcode || b.description
          ),
        bookingId: compareStrings,
        bookedStudents: compareStrings,
        contact: compareStrings,
        project: compareStrings,
        tape: (a) => a,
        overnight: (a) => a,
      }[name];
    }

    function onSubmit(form) {
      const query = getClosedFormsQuery(form);
      filteredForms = applyTo(
        sort(
          filter(closedForms, query),
          compareKey(closedFormsSort, getSortingFn(closedFormsSort))
        )
      )(closedFormsSortAscending ? identity : reverse);
      const length = filteredForms.length;
      queryCount.textContent =
        length == 1 ? `${length} form` : `${length} forms`;
      setClosedFormsQuery(query);
      update(
        closedFormsContainer,
        ClosedFormsTable({ forms: filteredForms, onSort, showFormPage })
      );
    }

    function filter(array, query) {
      const { start, end, location, students, items, matchItems } = query;
      const appliedFilters = [];

      appliedFilters.push(FormFilters.byTimeRange(start, end));

      if (location != "All") {
        appliedFilters.push(FormFilters.byLocation(location));
      }

      if (students) {
        appliedFilters.push(FormFilters.byStudentName(students));
      }

      if (items && matchItems == "all") {
        appliedFilters.push(FormFilters.byMatchAllItemID(items));
      }

      if (items && matchItems == "any") {
        appliedFilters.push(FormFilters.byMatchAnyItemID(items));
      }

      checkboxKeys.forEach(
        (key) => query[key] && appliedFilters.push(FormFilters[key])
      );

      return appliedFilters.reduce((forms, func) => forms.filter(func), array);
    }
  }
