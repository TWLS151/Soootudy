# SWEA-1946 간단한 압축 풀기


T = int(input())

for test_case in range(1, T + 1):
    N = int(input())
    zipped_doc = [list(input().split()) for _ in range(N)]

    # 복원된 전체 문자들을 담을 리스트
    origin_doc = []

    for alphabet, cnt in zipped_doc:
        # 알파벳을 개수(cnt)만큼 곱해 리스트에 하나씩 확장(extend)하여 추가
        origin_doc.extend(alphabet * int(cnt))

    print(f'#{test_case}')
    # 복원된 전체 리스트를 10개씩 건너뛰며 순회
    for i in range(0, len(origin_doc), 10):
        # 현재 위치 i부터 i+10 전까지 슬라이싱하여 문자열로 합쳐 출력
        print(''.join(origin_doc[i:i+10]))
