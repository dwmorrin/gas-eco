JsBundle = bundle.js
BUILDDIR := build
GsBundle := $(BUILDDIR)/bundle.js
HtmlBundle := $(BUILDDIR)/index.html

all: $(GsBundle) $(HtmlBundle)

# gs build note: IIFEs work if you attach functions
#   to globalThis, but those functions will not be reachable by
#   client-side code.  Use any side-effect (e.g. assignment)
#   to convince Rollup not to skip/tree-shake your entry file.
$(GsBundle): $(wildcard gs/*) | $(BUILDDIR)
	rollup gs/index.js -o $@

$(JsBundle): $(shell find js -type file)
	rollup js/index.js -o $@ -f iife

$(HtmlBundle): html/index.html $(JsBundle) $(wildcard css/*) | $(BUILDDIR)
	inline --entry html/index.html \
	  --output $@ --css css

$(BUILDDIR):
	mkdir -p $@; cd $@; clasp create

push: $(wildcard $(BUILDDIR)/*)
	cd $(BUILDDIR); clasp push
	touch push

open:
	cd $(BUILDDIR); clasp open
