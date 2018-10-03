ADVOCATE = {
  "_id": "59011f04d18396000fe76b0f",
  "created": "2017-08-14T21:03:17.381Z",
  "code": "myadvocatecode",
  "fullName": "Boop Jones",
  "lastName": "Jones",
  "firstName": "Boop",
  "__v": 0
}

TENANT = {
  "_id": "59011f04d18396000fe76b0e",
  "updated": "2017-08-14T21:03:17.381Z",
  "sharing": {
    "key": "2IE2RbLY21",
    "enabled": False
  },
  "created": "2017-04-26T22:28:20.706Z",
  "phone": "0005552342",
  "activity": [
    {
      "_id": "59011f04d18396000fe76b10",
      "relatedProblems": [],
      "fields": [],
      "photos": [],
      "loggedBy": "Test Test",
      "description": "",
      "title": "modules.activity.other.created",
      "key": "createAcount",
      "createdDate": "2017-04-26T22:27:20.714Z",
      "startDate": "2017-04-26T22:27:20.714Z"
    },
    {
      "_id": "59920fddf459ec000f6db827",
      "relatedProblems": [],
      "fields": [],
      "photos": [
        {
          "url": "https://justfix.s3.amazonaws.com/images/100004453189.jpg",
          "thumb": "https://justfixresized.s3.amazonaws.com/images/100004453189.jpg",
          "_id": "59920fddf459ec000f6db828",
          "created": "2017-08-14T21:02:21.906Z",
          "exif": {
            "orientation": 6
          }
        }
      ],
      "loggedBy": "Test Test",
      "description": "testing image",
      "title": "modules.activity.other.statusUpdate",
      "key": "statusUpdate",
      "createdDate": "2017-08-14T21:02:21.905Z",
      "startDate": "2017-08-14T21:02:21.905Z"
    },
    {
      "_id": "59921015d11c7f000fa6f236",
      "relatedProblems": [],
      "fields": [],
      "photos": [
        {
          "url": "https://justfix.s3.amazonaws.com/images/100007136324.jpg",
          "thumb": "https://justfixresized.s3.amazonaws.com/images/100007136324.jpg",
          "_id": "59921015d11c7f000fa6f237",
          "created": "2017-08-14T21:03:17.377Z",
          "exif": {
            "orientation": 6
          }
        }
      ],
      "loggedBy": "Test Test",
      "description": "another test",
      "title": "modules.activity.other.statusUpdate",
      "key": "statusUpdate",
      "createdDate": "2017-08-14T21:03:17.377Z",
      "startDate": "2017-08-14T21:03:17.377Z"
    }
  ],
  "problems": [],
  "followUpFlags": [],
  "actionFlags": [
    "initial",
    "allInitial",
    "scheduleLater",
    "isRentStabilized",
    "statusUpdate"
  ],
  "geo": {
    "bin": "3031404",
    "cd": "308",
    "zip": "11216",
    "bUSPS": "BROOKLYN",
    "bCode": "3",
    "streetName": "PARK PLACE",
    "streetNum": "654",
    "lat": 40.67379741301762,
    "lon": -73.95627813225379,
    "bbl": "3012380016"
  },
  "unit": "12",
  "address": "654 Park Place",
  "borough": "Brooklyn",
  "fullName": "Testy Test",
  "lastName": "Test",
  "firstName": "Testy",
  "currentAcuityEventId": "",
  "advocateRole": "none",
  "__v": 2
}

SALT = (b'WD\x1c\xef\xbf\xbdw#3\xef\xbf\xbd`\xef'
        b'\xbf\xbdo\xef\xbf\xbd\xdd\x8dC\xef\xbf\xbd').decode('utf-8')

SALT_BYTES = b'WD\x1c\xfdw#3\xfd`\xfdo\xfdMC\xfd'

PASSWORD_HASH = ("QTpO6r2r4RmHmgSj8cppCtkGVszO+W83K9trJpTtqGeNTIDr"
                 "4o7DxPUsM3TpQ8jJSMtFASSrWLZPqK0XR/L8Dw==")

PASSWORD = "password"

IDENTITY = {
  "_id": "59011f04d18396000fe76b0d",
  "salt": SALT,
  "provider": "local",
  "created": "2017-04-26T22:28:20.699Z",
  "roles": [
    "tenant"
  ],
  "password": PASSWORD_HASH,
  "phone": "0005552342",
  "__v": 0
}

USER = {
  '_id': 'aewgaeg',
  'kind': 'Tenant',
  '_userdata': 'blah',
}
