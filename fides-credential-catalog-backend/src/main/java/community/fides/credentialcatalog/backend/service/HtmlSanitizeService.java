package community.fides.credentialcatalog.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Service;


@Service
@Slf4j
public class HtmlSanitizeService {

    public String sanitize(String untrustedHTML) {
        final String[] allowedElements = {"p", "b", "i", "u", "strong", "em", "br", "ul", "ol", "li", "span", "h1", "h2", "h3", "h4", "h5", "h6"};
        PolicyFactory policy = new HtmlPolicyBuilder()
                .allowElements(allowedElements)
                .allowUrlProtocols("https")
                .allowAttributes("style", "class", "data-list", "contenteditable").onElements(allowedElements)
                .requireRelNofollowOnLinks()
                .toFactory();
        final String sanitized = policy.sanitize(untrustedHTML);
        if (!sanitized.equals(untrustedHTML)) {
            log.info("UnSanitized HTML: {}", untrustedHTML);
            log.info("Sanitized HTML  : {}", sanitized);
            log.warn("HTML Sanitization detected and removed potentially harmful content. UnSanitized HTML: {}, Sanitized HTML: {}", untrustedHTML, sanitized);
        }
        return sanitized;
    }
}
