package community.fides.credentialcatalog.backend.utils;

public class EqualUtils {

    public static Boolean equals(final Object item1, final Object item2) {
        if ((item1 == null) || (item2 == null)){
            return false;
        }
        return item1.equals(item2);
    }

}
