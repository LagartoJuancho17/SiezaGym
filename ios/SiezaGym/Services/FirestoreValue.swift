import FirebaseFirestore
import Foundation

/// Firestore devuelve numeros como `NSNumber` y fechas como `Timestamp`. Los
/// casts directos (`as? Int` sobre un 3.0, `as? Double` sobre un 3) fallan de
/// forma silenciosa y dejan ceros en la UI, asi que todo pasa por aca.
nonisolated enum FirestoreValue {
    static func double(_ value: Any?) -> Double? {
        switch value {
        case let number as NSNumber: number.doubleValue
        case let string as String: Double(string)
        default: nil
        }
    }

    static func int(_ value: Any?) -> Int? {
        switch value {
        case let number as NSNumber: number.intValue
        case let string as String: Int(string)
        default: nil
        }
    }

    static func bool(_ value: Any?) -> Bool? {
        (value as? NSNumber)?.boolValue
    }

    static func date(_ value: Any?) -> Date? {
        switch value {
        case let timestamp as Timestamp: timestamp.dateValue()
        case let date as Date: date
        case let string as String: ISO8601DateFormatter().date(from: string)
        default: nil
        }
    }
}
