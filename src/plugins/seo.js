import Vue from 'vue'
import Cookies from 'js-cookie'
const localHtmlAttrsCookieKey = 'localHtmlAttrs'
Vue.mixin({
  head () {
    const COMPONENT_OPTIONS_KEY = '<%= options.COMPONENT_OPTIONS_KEY %>'
    // issues: https://github.com/nuxt-community/nuxt-i18n/issues/115 （It's not a good way to repair.）
    // TODO + FIXME:There is another problem. There is no time to solve it. Title is also deleted.
    let returnData = {}
    if (Cookies.get(localHtmlAttrsCookieKey)) {
      returnData = JSON.parse(Cookies.get(localHtmlAttrsCookieKey))
    }
    if (
      !this._hasMetaInfo ||
      !this.$i18n ||
      !this.$i18n.locales ||
      this.$options[COMPONENT_OPTIONS_KEY] === false ||
      (this.$options[COMPONENT_OPTIONS_KEY] && this.$options[COMPONENT_OPTIONS_KEY].seo === false)
    ) {
      return returnData;
    }
    const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
    const LOCALE_ISO_KEY = '<%= options.LOCALE_ISO_KEY %>'
    const BASE_URL = '<%= options.baseUrl %>'

    // Prepare html lang attribute
    const htmlAttrs = {}
    const currentLocaleData = this.$i18n.locales.find(l => l[LOCALE_CODE_KEY] === this.$i18n.locale)
    if (currentLocaleData && currentLocaleData[LOCALE_ISO_KEY]) {
      htmlAttrs.lang = currentLocaleData[LOCALE_ISO_KEY]
    }

    // hreflang tags
    const link = this.$i18n.locales
      .map(locale => {
        if (locale[LOCALE_ISO_KEY]) {
          return {
            hid: 'alternate-hreflang-' + locale[LOCALE_ISO_KEY],
            rel: 'alternate',
            href: BASE_URL + this.switchLocalePath(locale.code),
            hreflang: locale[LOCALE_ISO_KEY]
          }
        } else {
          console.warn('[<%= options.MODULE_NAME %>] Locale ISO code is required to generate alternate link')
          return null
        }
      })
    .filter(item => !!item)

    // og:locale meta
    const meta = []
    // og:locale - current
    if (currentLocaleData && currentLocaleData[LOCALE_ISO_KEY]) {
      meta.push({
        hid: 'og:locale',
        name: 'og:locale',
        property: 'og:locale',
        // Replace dash with underscore as defined in spec: language_TERRITORY
        content: currentLocaleData[LOCALE_ISO_KEY].replace(/-/g, '_')
      })
    }
    // og:locale - alternate
    meta.push(
      ...this.$i18n.locales
        .filter(l => l[LOCALE_ISO_KEY] && l[LOCALE_ISO_KEY] !== currentLocaleData[LOCALE_ISO_KEY])
        .map(locale => ({
          hid: 'og:locale:alternate-' + locale[LOCALE_ISO_KEY],
          name: 'og:locale:alternate',
          property: 'og:locale:alternate',
          content: locale[LOCALE_ISO_KEY].replace(/-/g, '_')
        }))
    );
    returnData = {
      htmlAttrs,
      link,
      meta
    }
    // save to local
    const date = new Date()
    Cookies.set(localHtmlAttrsCookieKey, JSON.stringify(returnData), {
      expires: new Date(date.setDate(date.getDate() + 365))
    })
    return returnData
  }
})

