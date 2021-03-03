JsBundle = bundle.js
BUILDDIR := build
GsBundle := $(BUILDDIR)/bundle.js
HtmlBundle := $(BUILDDIR)/index.html

all: $(GsBundle) $(HtmlBundle)

# rollup wants to "export", but GAS doesn't know about export
# Maybe rollup can be configured? For now, just using sed to kill that one line
$(GsBundle): $(wildcard gs/*) | $(BUILDDIR)
	rollup gs/index.js -o $@
	if sed -i.bak '/^[[:space:]]*export/d' $@; then rm $@.bak; fi

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
