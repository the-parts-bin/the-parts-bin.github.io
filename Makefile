# Local preview of the GitHub Pages site at http://localhost:4000
#
#   make serve   live-reloading preview, including _drafts/
#   make build   one-off build into _site/

# Debian/Ubuntu may only ship the versioned executable (bundle3.3).
BUNDLE ?= $(shell command -v bundle || command -v bundle3.3 || echo bundle)

# Gems go outside the site: jekyll serve puts an inotify watch on every
# directory under the source, excluded ones too, and the gems are ~1,000.
GEM_PATH_DIR ?= $(HOME)/.local/share/bundle

.PHONY: install serve build clean

install:
	$(BUNDLE) config set --local path $(GEM_PATH_DIR)
	$(BUNDLE) install

serve: install
	$(BUNDLE) exec jekyll serve --livereload --drafts

build: install
	$(BUNDLE) exec jekyll build

clean:
	rm -rf _site .jekyll-cache .sass-cache .jekyll-metadata
